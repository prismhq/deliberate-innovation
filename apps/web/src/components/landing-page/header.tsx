"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@prism/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@prism/ui/components/drawer";
import { Menu, ChevronRight, ExternalLink } from "lucide-react";
import { CompanyLogo } from "~/components/company-logo";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (href: string, label: string, external?: boolean) => {
    if (label === "Features") {
      const sectionId = label.toLowerCase();

      if (pathname === "/") {
        // Already on home page, just scroll to section
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        // Navigate to home page with hash
        router.push(`/#${sectionId}`);
      }
    } else if (external) {
      // Handle external links
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      // Handle other navigation normally
      router.push(href);
    }
    setMobileDrawerOpen(false);
  };

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "https://docs.prismai.sh", label: "Docs", external: true },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 border-b border-white/20 bg-background transition-transform duration-300 ease-in-out ${className || ""}`}
    >
      <div className="mx-auto max-w-wide px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <CompanyLogo href="/" showName={true} title="Prism Auth" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() =>
                  handleNavClick(link.href, link.label, link.external)
                }
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
              >
                {link.label}
                {link.external && <ExternalLink className="h-3 w-3" />}
              </button>
            ))}
          </nav>

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
                <div className="px-4 pb-6 space-y-6">
                  {/* Mobile Navigation Links */}
                  <nav className="space-y-4">
                    {navLinks.map((link) => (
                      <button
                        key={link.href}
                        onClick={() =>
                          handleNavClick(link.href, link.label, link.external)
                        }
                        className="flex items-center justify-between py-2 text-base font-medium text-foreground hover:text-primary transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-1">
                          {link.label}
                          {link.external && (
                            <ExternalLink className="h-3 w-3" />
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </nav>

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
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}
