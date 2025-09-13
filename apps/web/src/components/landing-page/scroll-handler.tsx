"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ScrollHandler() {
  const router = useRouter();
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle hash changes and initial hash - separate effect
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          // Small delay to ensure page is loaded
          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      }
    };

    // Handle initial hash on page load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Handle scroll for header visibility - separate effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const header = document.querySelector("header");

      if (!header) return;

      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        // Scrolling up or at top of page - show header
        header.style.transform = "translateY(0)";
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide header
        header.style.transform = "translateY(-100%)";
      }

      setLastScrollY(currentScrollY);
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return null;
}
