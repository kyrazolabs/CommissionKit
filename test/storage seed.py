#!/usr/bin/env python3
"""s3_seed.py: Create a few specific files in an existing S3 bucket."""
import sys
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

# --- Configuration ---
ENDPOINT   = "https://s3qrdtoakv.kyrazo.com"   # your S3 API domain (no port)
ACCESS_KEY = "eVVL02Fe1p4zyegBuHRB"          # console -> Access Keys -> Create
SECRET_KEY = "9fdlx5X97qf41N9YGZT8TURWQtIQP5QZjzrad2nd"
BUCKET     = "storage-integ-test"          # created + deleted by the test
REGION     = "us-east-1"  # Change if your backend requires a specific region

FILES_TO_CREATE = {
    "data/config.json": '{"env": "staging", "debug": true}',
    "data/readme.txt":  "This bucket contains integration test fixtures.",
    "healthcheck/ping": "ok",
}

s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    region_name=REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
)


def ensure_bucket():
    """Create bucket only if it doesn't exist; distinguish real errors from benign ones."""
    try:
        s3.head_bucket(Bucket=BUCKET)
        print(f"  [OK]    Bucket '{BUCKET}' already exists")
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "404" or code == "NoSuchBucket":
            # Bucket genuinely missing — safe to create
            pass
        elif code == "403":
            # Bucket exists but we lack permission to head it;
            # creation will also fail, so surface this clearly
            print(f"  [FAIL]  Bucket '{BUCKET}' exists but access denied (403)")
            return False
        else:
            print(f"  [FAIL]  Unexpected error checking bucket: {code}: {e}")
            return False

    # Bucket doesn't exist — attempt creation
    try:
        kwargs = {"Bucket": BUCKET}
        # Only set LocationConstraint for non-us-east-1 on AWS;
        # omit for MinIO/path-style endpoints to avoid rejection
        if REGION != "us-east-1":
            kwargs["CreateBucketConfiguration"] = {"LocationConstraint": REGION}
        s3.create_bucket(**kwargs)
        print(f"  [OK]    Bucket '{BUCKET}' created")
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
            # Race condition: another process created it between head and create
            print(f"  [OK]    Bucket '{BUCKET}' appeared during creation (race-safe)")
            return True
        print(f"  [FAIL]  Could not create bucket: {code}: {e}")
        return False


def seed_files():
    """Upload each file, reporting success/failure individually."""
    results = []
    for key, content in FILES_TO_CREATE.items():
        try:
            body = content.encode("utf-8") if isinstance(content, str) else content
            s3.put_object(Bucket=BUCKET, Key=key, Body=body)
            print(f"  [OK]    {key} ({len(body)} bytes)")
            results.append(True)
        except Exception as e:
            print(f"  [FAIL]  {key}\n          {type(e).__name__}: {e}")
            results.append(False)
    return results


if __name__ == "__main__":
    print(f"\nTarget: {ENDPOINT}/{BUCKET}\n")

    if not ensure_bucket():
        print("\nAborting: bucket not available.")
        sys.exit(1)

    print()
    ok = sum(seed_files())
    total = len(FILES_TO_CREATE)
    print(f"\n{'='*40}\n  {ok}/{total} files created\n{'='*40}")
    sys.exit(0 if ok == total else 1)
