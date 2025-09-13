"use client";

import { signOut } from "~/auth/client";
import { LogOut } from "lucide-react";
import { Button } from "@prism/ui/components/button";
import { useRouter } from "next/navigation";

export interface SignOutButtonProps {
  /**
   * When true, disables the button and prevents sign-out action.
   * @default false
   */
  disabled?: boolean;
}

export function SignOutButton({ disabled = false }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = () => {
    if (disabled) return;
    void signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleSignOut}
      className="flex h-9 min-w-9 items-center justify-center rounded-full border p-0 transition-colors md:min-h-10 md:min-w-10"
      disabled={disabled}
      aria-disabled={disabled}
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Sign Out</span>
    </Button>
  );
}
