"use client";

import { useState } from "react";
import { Button } from "@prism/ui/components/button";
import { Textarea } from "@prism/ui/components/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { authClient } from "~/auth/client";

interface InviteTeamMembersProps {
  onSuccess?: () => void;
  onSkip?: () => void;
}

export function InviteTeamMembers({
  onSuccess,
  onSkip,
}: InviteTeamMembersProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  };

  const startInviteProcess = async () => {
    const emailsToProcess = parseEmails(emailInput);

    if (emailsToProcess.length === 0) {
      setInviteStatus({
        message: "Please enter at least one email address",
        isError: true,
      });
      return;
    }

    const invalidEmail = emailsToProcess.find((email) => !validateEmail(email));
    if (invalidEmail) {
      setInviteStatus({
        message: `Invalid email address: ${invalidEmail}`,
        isError: true,
      });

      // Track validation error
      return;
    }

    setIsInviting(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emailsToProcess.length; i++) {
      const email = emailsToProcess[i];
      setInviteStatus({
        message: `Inviting ${email} (${i + 1} of ${emailsToProcess.length})`,
      });

      try {
        await authClient.organization.inviteMember({
          email: email as string,
          role: "admin",
        });

        successCount++;
      } catch (error) {
        failCount++;

        setInviteStatus({
          message: `Failed to invite ${email}: ${error instanceof Error ? error.message : "Unknown error"}`,
          isError: true,
        });
        setIsInviting(false);

        return;
      }
    }

    onSuccess?.();
    setEmailInput("");
    setInviteStatus(null);
    setIsInviting(false);
  };

  const hasInput = emailInput.trim().length > 0;

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email Addresses</label>
        <div className="flex flex-col gap-2">
          <div className="space-y-2">
            <Textarea
              placeholder={`pg@ycombinator.com
brian@airbnb.com`}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              rows={5}
              className="resize-none"
            />
            {inviteStatus && (
              <p
                className={
                  inviteStatus.isError
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {inviteStatus.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {onSkip && (
          <Button
            variant="outline"
            onClick={() => {
              onSkip();
            }}
            className="flex-1"
          >
            Skip for now
          </Button>
        )}
        <Button
          onClick={startInviteProcess}
          disabled={isInviting || !hasInput}
          className="flex-1"
        >
          {isInviting ? "Sending..." : "Send Invites"}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Invite Your Team</CardTitle>
        <CardDescription>
          Enter up to 50 email addresses, separated by commas or new lines
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
