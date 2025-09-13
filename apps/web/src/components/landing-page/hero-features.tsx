"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@prism/ui/components/button";

export default function HeroFeatures() {
  return (
    <div className="w-full bg-transparent space-y-24">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
        <div className="space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Deliberate Innovation
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Find patterns in your Documented Primary Interactions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <Image
            src="/images/hero-image.png"
            alt="Deliberate Innovation"
            width={600}
            height={400}
            className="rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
