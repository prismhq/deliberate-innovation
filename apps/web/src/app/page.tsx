import Header from "~/components/landing-page/header";
import HeroFeatures from "~/components/landing-page/hero-features";
import ScrollHandler from "~/components/landing-page/scroll-handler";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Content */}
      <div className="relative min-h-screen flex flex-col">
        <ScrollHandler />
        <Header />

        <main className="mx-auto max-w-wide px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex-1 flex items-center justify-center">
          <HeroFeatures />
        </main>

        <Toaster />
      </div>
    </div>
  );
}
