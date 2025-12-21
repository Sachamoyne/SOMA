import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-8 text-center">
        <h1 className="text-4xl font-bold">ANKIbis</h1>
        <p className="text-lg text-muted-foreground">
          Apprenez efficacement avec la répétition espacée.
          <br />
          Interface moderne et épurée.
        </p>
        <Link href="/dashboard">
          <Button size="lg">Open app</Button>
        </Link>
      </div>
    </div>
  );
}

