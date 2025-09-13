"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@prism/ui/components/button";
import { ScrollArea } from "@prism/ui/components/scroll-area";
import { CompanyLogo } from "~/components/company-logo";
import { useSession } from "~/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@prism/ui/components/avatar";
import { Eye, ChevronLeft, LogOut, Cable, FileText } from "lucide-react";
import { signOut } from "~/auth/client";
import { useRouter } from "next/navigation";
import { CollectionContext } from "./collection-context";
import { api } from "~/trpc/react";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Eye, href: "" },
  { id: "documents", label: "Documents", icon: FileText, href: "/documents" },
];

interface WorkspaceLayoutProps {
  children: ReactNode;
}

// Inline SignOutButton component
function SignOutButton({ disabled = false }: { disabled?: boolean }) {
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

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const params = useParams();
  const pathname = usePathname();
  const collectionId = params.collectionId as string;
  const { data: session } = useSession();

  const {
    data: collection,
    isLoading,
    error,
  } = api.collections.getById.useQuery(
    { collectionId },
    { enabled: collectionId != null }
  );

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? "U";

  // Determine current page based on pathname
  const getCurrentPageTitle = () => {
    const currentPath = pathname.split("/").pop() || "";
    const currentItem = sidebarItems.find((item) => {
      if (item.href === "" && currentPath === collectionId) return true;
      return item.href.substring(1) === currentPath;
    });
    return currentItem?.label || "Overview";
  };

  return (
    <CollectionContext.Provider
      value={{
        isLoading,
        error,
        collection,
      }}
    >
      <div className="flex h-screen">
        <div
          className={`bg-card/50 backdrop-blur-sm static inset-y-0 left-0 transform border-r transition-all duration-300 ease-out ${sidebarOpen ? "w-80 translate-x-0" : "w-20 translate-x-0"} `}
        >
          <div
            className={`flex h-16 items-center border-b p-l ${
              sidebarOpen ? "justify-start" : "justify-center"
            }`}
          >
            <CompanyLogo href="/workspace" showName={sidebarOpen} />
          </div>

          <ScrollArea className="flex-1">
            <nav>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const href = `/workspace/${collectionId}${item.href}`;
                const isActive =
                  (item.href === "" &&
                    pathname === `/workspace/${collectionId}`) ||
                  (item.href !== "" &&
                    pathname === `/workspace/${collectionId}${item.href}`);

                return (
                  <Link
                    key={item.id}
                    href={href}
                    prefetch={true}
                    className={`flex w-full transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    } ${
                      sidebarOpen
                        ? "items-center gap-m px-l py-l"
                        : "items-center justify-center px-0 py-l"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span
                      className={`prism-text-l-semibold tracking-normal normal-case ${sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-background/50 backdrop-blur-sm flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <ChevronLeft
                  className={`h-4 w-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
                />
              </Button>
              <h1 className="prism-text-l-semibold leading-none flex items-center gap-3">
                {collection && (
                  <>
                    <span>{collection.name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{getCurrentPageTitle()}</span>
                  </>
                )}
                {!collection && <span>{getCurrentPageTitle()}</span>}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <SignOutButton />

              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-content p-xl">{children}</div>
          </main>
        </div>
      </div>
    </CollectionContext.Provider>
  );
}
