import { Info } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface FallbackBannerProps {
  message: string;
  readInLabel: string;
  fallbackUrl: string;
}

export function FallbackBanner({ message, readInLabel, fallbackUrl }: FallbackBannerProps) {
  return (
    <Card
      className="bg-secondary border-border rounded-lg p-4 mb-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Info className="size-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1 text-sm text-muted-foreground">
          <p>{message}</p>
        </div>
        <Link
          href={fallbackUrl}
          className="text-sm font-medium text-primary hover:underline shrink-0"
        >
          {readInLabel}
        </Link>
      </div>
    </Card>
  );
}
