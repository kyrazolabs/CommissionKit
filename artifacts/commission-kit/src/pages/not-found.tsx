import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-1">
          The page you're looking for doesn't exist.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
