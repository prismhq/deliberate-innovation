import Link from "next/link";
import { Button } from "@prism/ui/components/button";
import { ArrowLeft, PenTool, Zap } from "lucide-react";
import Header from "~/components/landing-page/header";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header className="bg-background" />

      <main className="flex-1 flex items-center justify-center mx-auto max-w-wide px-4 sm:px-6 lg:px-8 py-12 pt-24 bg-transparent">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <PenTool className="h-12 w-12 text-primary" />
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Coming Soon
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our blog is currently under construction. Stay tuned for insights,
            tutorials, and updates about agent authentication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <Zap className="h-4 w-4" />
                Get Started
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
