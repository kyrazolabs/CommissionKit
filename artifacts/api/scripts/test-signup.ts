import { connectDB } from "@workspace/db";
import { auth } from "../src/lib/auth";

async function run() {
  await connectDB();

  const email = `test-signup-${Date.now()}@portal.commissionkit.io`;
  const password = "testpassword123";

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Test Rep",
        mustChangePassword: true,
        repId: "dummy-id",
      },
    });
    console.log("Success:", result);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
  process.exit(0);
}
run();
