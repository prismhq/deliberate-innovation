"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "~/auth/client";
import ReactConfetti from "react-confetti";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import { Loader } from "lucide-react";
import { authClient } from "~/auth/client";

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);

  const { data: session, isPending } = useSession();

  const handleAcceptInvitation = async () => {
    try {
      setIsAccepting(true);
      await authClient.organization.acceptInvitation({
        invitationId: id,
      });
      setShowConfetti(true);
      setTimeout(() => {
        setIsRedirecting(true);
        router.push("/workspace");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation",
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-form">
          <CardHeader>
            <CardTitle>Checking Invitation</CardTitle>
            <CardDescription>
              Please wait while we verify your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepting) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-form">
          <CardHeader>
            <CardTitle>Processing Invitation</CardTitle>
            <CardDescription>
              Please wait while we process your invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-form">
          <CardHeader>
            <CardTitle>Redirecting...</CardTitle>
            <CardDescription>
              Taking you to your organization workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-form">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in or create an account to accept this invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={() =>
                router.push(`/login?callbackUrl=/accept-invitation/${id}`)
              }
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/signup?callbackUrl=/accept-invitation/${id}`)
              }
              className="w-full"
            >
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-form">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/workspace")}
              className="w-full"
            >
              Go to Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      {showConfetti && <ReactConfetti recycle={false} />}
      <Card className="w-full max-w-form">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            Click below to join the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAcceptInvitation}
            className="w-full"
            disabled={isAccepting || showConfetti}
          >
            {isAccepting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : showConfetti ? (
              "Invitation Accepted!"
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
