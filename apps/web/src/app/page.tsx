import Header from "~/components/landing-page/header";
import HeroFeatures from "~/components/landing-page/hero-features";
import ScrollHandler from "~/components/landing-page/scroll-handler";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Content */}
      <div className="relative min-h-screen">
        <ScrollHandler />
        <Header />

        <main className="mx-auto max-w-wide px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <HeroFeatures />
        </main>

        <footer className="border-t border-white/20 bg-transparent backdrop-blur-sm">
          <div className="mx-auto max-w-wide px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </a>
                <a
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="/support"
                  className="hover:text-foreground transition-colors"
                >
                  Support
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 Prism Technologies Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <Toaster />
      </div>
    </div>
  );
}
