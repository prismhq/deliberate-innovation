"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "~/auth/client";
import * as Progress from "@radix-ui/react-progress";
import { InviteTeamMembers } from "~/components/auth/invite-team-members";
import { Button } from "@prism/ui/components/button";
import { Input } from "@prism/ui/components/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@prism/ui/components/card";
import { api } from "~/trpc/react";

export default function Page() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");

  const firstName = session?.user?.name?.split(" ")[0] || "";

  const createOrg = api.organization.create.useMutation({
    onSuccess: async (data) => {
      await authClient.organization.setActive({
        organizationId: data.organization.id,
      });
      setStep(2);
    },
  });

  const handleOrgCreate = () => {
    const nameToUse = orgName.trim() || `${firstName}'s Org`;
    createOrg.mutate({
      name: nameToUse,
    });
  };

  const handleSkipOrgName = () => {
    createOrg.mutate({
      name: `${firstName}'s Org`,
    });
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="mx-auto w-full max-w-form space-y-6">
        <div className="w-full">
          <Progress.Root className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <Progress.Indicator
              className="h-full w-full flex-1 bg-primary transition-all"
              style={{
                transform: `translateX(-${100 - (step === 1 ? 50 : 100)}%)`,
              }}
            />
          </Progress.Root>
        </div>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Create Your Organization
              </CardTitle>
              <CardDescription>
                Let&apos;s get started by creating your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Organization Name
                  </label>
                  <Input
                    placeholder={`${firstName}'s Org`}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSkipOrgName}
                    className="flex-1"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={handleOrgCreate}
                    disabled={createOrg.isPending}
                    className="flex-1"
                  >
                    {createOrg.isPending
                      ? "Creating..."
                      : "Create Organization"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <InviteTeamMembers
            onSuccess={() => {
              router.push(`/workspace`);
            }}
            onSkip={() => {
              router.push(`/workspace`);
            }}
          />
        )}
      </div>
    </div>
  );
}
