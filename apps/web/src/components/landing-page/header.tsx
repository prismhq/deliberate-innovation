"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@prism/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@prism/ui/components/drawer";
import { Menu } from "lucide-react";
import { CompanyLogo } from "~/components/company-logo";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 w-full z-50 border-b border-border bg-background transition-transform duration-300 ease-in-out ${className || ""}`}
    >
      <div className="mx-auto max-w-wide px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <CompanyLogo href="/" showName={true} />

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>

            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Navigation</DrawerTitle>
                </DrawerHeader>

                {/* Mobile CTAs */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>

                  <Link href="/signup">
                    <Button className="w-full">Get started</Button>
                  </Link>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}
