"use client";

import type * as React from "react";
import Image from "next/image";
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
  title = "Prism Auth",
  className,
  ...props
}: CompanyLogoProps) {
  return (
    <Link href={href}>
      <div
        className={cn("flex cursor-pointer items-center gap-2", className)}
        {...props}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
          {/* Dark mode logo */}
          <Image
            src="/images/favicon-dark.png"
            alt="Prism AI Logo"
            width={32}
            height={32}
            className="h-full w-full object-contain"
          />
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
