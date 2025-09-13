import "@prism/ui/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { TRPCReactProvider } from "../trpc/react";
import { HydrateClient } from "../trpc/server";
import { Squares } from "~/components/landing-page/squares-background";

export const metadata: Metadata = {
  title: "Delibrate Innovation",
  description: "Find patterns in your Documented Primary Interactions",
  icons: {
    icon: [
      {
        url: "/images/favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/images/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Animated Squares Background */}
        <div className="fixed inset-0 -z-10">
          <Squares
            direction="diagonal"
            speed={0}
            squareSize={60}
            borderColor="#e5e7eb"
          />
        </div>

        <TRPCReactProvider>
          <HydrateClient>{children}</HydrateClient>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
