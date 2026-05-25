import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl font-semibold">Page Not Found</p>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild><Link href="/dashboard">Go to Dashboard</Link></Button>
    </div>
  );
}
