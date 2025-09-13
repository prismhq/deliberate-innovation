"use client";

import { useSession } from "~/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@prism/ui/components/avatar";
import { CompanyLogo } from "~/components/company-logo";
import { SignOutButton } from "~/components/auth/sign-out-button";
import { ThemeToggle } from "~/components/theme-toggle";

interface WorkspaceNavbarProps {
  title?: string;
}

export const WorkspaceNavbar: React.FC<WorkspaceNavbarProps> = ({ title }) => {
  const { data: session } = useSession();

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? "U";
  return (
    <nav className="bg-background/50 backdrop-blur-sm flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center space-x-4">
        <CompanyLogo href="/workspace" />
        {title && (
          <>
            <span className="text-[var(--color-foreground-60)]">•</span>
            <span className="prism-text-xl-semibold text-[var(--color-foreground-80)]">
              {title}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />

        <SignOutButton />

        <Avatar className="h-9 w-9 cursor-pointer md:h-10 md:w-10">
          <AvatarImage
            src={session?.user?.image ?? undefined}
            alt={session?.user?.name ?? "User"}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="bg-blue-600 text-white">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
};
