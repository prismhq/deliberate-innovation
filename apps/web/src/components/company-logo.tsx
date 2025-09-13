"use client";

import type * as React from "react";
import Link from "next/link";
import { cn } from "../lib/utils";

interface CompanyLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showName?: boolean;
  href: string;
  title?: string;
}

export function CompanyLogo({
  showName = true,
  href,
  title = "Delibrate Innovation",
  className,
  ...props
}: CompanyLogoProps) {
  return (
    <Link href={href}>
      <div
        className={cn("flex cursor-pointer items-center gap-2", className)}
        {...props}
      >
        <div className="h-8 w-8 shrink-0 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            {/* Outer ring */}
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            {/* Inner geometric pattern */}
            <path
              d="M8 16L16 8L24 16L16 24Z"
              fill="currentColor"
              fillOpacity="0.8"
            />
            {/* Center dot */}
            <circle cx="16" cy="16" r="3" fill="currentColor" />
            {/* Innovation sparks */}
            <path
              d="M16 4L17 6L19 5L18 7L20 8L18 9L19 11L17 10L16 12L15 10L13 11L14 9L12 8L14 7L13 5L15 6L16 4Z"
              fill="currentColor"
              fillOpacity="0.6"
            />
          </svg>
        </div>
        {showName && (
          <div className="flex flex-col overflow-hidden">
            <h1 className="prism-text-xl-semibold whitespace-nowrap">
              {title}
            </h1>
          </div>
        )}
      </div>
    </Link>
  );
}
