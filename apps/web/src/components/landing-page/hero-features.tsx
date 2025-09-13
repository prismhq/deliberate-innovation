/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import Link from "next/link";
import { Button } from "@prism/ui/components/button";
import HeroAuthDemo from "./hero-auth-demo";
import { Card, CardContent } from "@prism/ui/components/card";
import {
  ArrowRight,
  X,
  Key,
  Database,
  Mail,
  Shield,
  Zap,
  Lock,
  Upload,
  Search,
  Play,
  ExternalLink,
} from "lucide-react";

const coreFeatures = [
  {
    icon: Key,
    title: "Document API",
    description:
      "Store & retrieve credentials programmatically with full encryption",
  },
  {
    icon: Database,
    title: "Session API",
    description: "Persist cookies/localStorage between agent runs seamlessly",
  },
  {
    icon: Mail,
    title: "Virtual Email & Phone",
    description:
      "Disposable inbox + phone numbers for verification code extraction",
  },
];

export default function HeroFeatures() {
  return (
    <div className="w-full bg-transparent space-y-24">
      {/* Hero Section */}
      <div className="grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Y Combinator Badge */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Backed by</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#ff6600] text-white flex items-center justify-center text-sm font-bold rounded-sm">
                  Y
                </div>
                <span className="text-[#ff6600] font-medium">Combinator</span>
              </div>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Authentication for autonomous agents
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Prism Auth is the API that lets browser agents securely store
              credentials, persist sessions, and handle MFA &mdash; without
              leaking secrets into prompts or code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <a
              href="https://docs.prismai.sh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="flex items-center gap-2"
              >
                View Docs
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        <div className="relative">
          <HeroAuthDemo />
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-12">
        <div className="text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to secure, persistent agent authentication.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Step 1 */}
            <Card className="bg-background border border-white/20 hover:bg-white/5 transition-all duration-200 flex-1">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Store Credentials</h3>
                <p className="text-muted-foreground">
                  Store or create credentials for websites that you haven&apos;t
                  logged into before with full encryption.
                </p>
              </CardContent>
            </Card>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Step 2 */}
            <Card className="bg-background border border-white/20 hover:bg-white/5 transition-all duration-200 flex-1">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Check Sessions</h3>
                <p className="text-muted-foreground">
                  Check for existing sessions before taking action. Skip login
                  when already authenticated.
                </p>
              </CardContent>
            </Card>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Step 3 */}
            <Card className="bg-background border border-white/20 hover:bg-white/5 transition-all duration-200 flex-1">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Authenticate & Run</h3>
                <p className="text-muted-foreground">
                  Handle login automatically when needed, including MFA. Run
                  seamlessly behind any login wall.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div id="features" className="space-y-12 scroll-mt-24">
        <div className="text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">Core Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for secure, scalable agent authentication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="bg-background border border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Built for Developers */}
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Built for Developers
          </h2>
          <p className="text-xl text-muted-foreground">
            Simple APIs that integrate seamlessly with your agent
            infrastructure. Get started in minutes with our SDKs and
            comprehensive documentation.
          </p>
          <div className="flex gap-4">
            <a
              href="https://docs.prismai.sh"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="flex items-center gap-2">
                View Docs
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://docs.prismai.sh/quickstart"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                Quickstart <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        <Card className="bg-muted border-border">
          <div className="font-mono text-sm space-y-2 bg-background p-4 rounded-lg border border-white/20">
            <div className="text-muted-foreground">
              // Agent authentication flow
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-primary">const</span> session ={" "}
                <span className="text-accent">await</span> prism.sessions.
                <span className="text-primary">check</span>(
                <span className="text-green-400">&quot;github.com&quot;</span>,
                collectionId);
              </div>
              <div>
                <span className="text-primary">if</span> (!session) {`{`}
              </div>
              <div className="ml-4">
                <span className="text-primary">const</span> creds ={" "}
                <span className="text-accent">await</span> prism.credentials.
                <span className="text-primary">get</span>(
                <span className="text-green-400">&quot;github.com&quot;</span>,
                collectionId);
              </div>
              <div className="ml-4">
                <span className="text-accent">await</span> agent.
                <span className="text-primary">login</span>(creds);
              </div>
              <div>{`}`}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* The Agent Authentication Problem */}
      <div className="text-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            The Agent Authentication Problem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Current solutions are brittle, insecure, and break with modern
            authentication requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="bg-background border border-white/20 relative overflow-hidden hover:bg-white/5 transition-all duration-200">
            <div className="absolute inset-0 bg-destructive/5"></div>
            <CardContent className="p-6 text-center space-y-4 relative z-10">
              <X className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="font-semibold text-destructive">Brittle Hacks</h3>
              <p className="text-sm text-muted-foreground">
                Agents can&apos;t log into apps without fragile workarounds
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background border border-white/20 relative overflow-hidden hover:bg-white/5 transition-all duration-200">
            <div className="absolute inset-0 bg-destructive/5"></div>
            <CardContent className="p-6 text-center space-y-4 relative z-10">
              <X className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="font-semibold text-destructive">
                Unsafe Credentials
              </h3>
              <p className="text-sm text-muted-foreground">
                Hard-coded credentials leak into prompts and code
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background border border-white/20 relative overflow-hidden hover:bg-white/5 transition-all duration-200">
            <div className="absolute inset-0 bg-destructive/5"></div>
            <CardContent className="p-6 text-center space-y-4 relative z-10">
              <X className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="font-semibold text-destructive">
                MFA Breaks Everything
              </h3>
              <p className="text-sm text-muted-foreground">
                Multi-factor authentication stops most automation dead
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold text-destructive">
              Without Prism Auth
            </div>
            <div className="text-sm text-muted-foreground">
              Manual &bull; Brittle &bull; Insecure
            </div>
          </div>
          <ArrowRight className="h-8 w-8 text-primary" />
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold text-primary">
              With Prism Auth
            </div>
            <div className="text-sm text-muted-foreground">
              Secure &bull; Automated &bull; Persistent
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center space-y-8 bg-background border border-white/20 rounded-2xl p-12">
        <div className="space-y-4">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Give your agents a secure login brain.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the future of agent authentication. Start building with Prism
            Auth today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg px-8"
            >
              Get Started
            </Button>
          </Link>
          <a
            href="https://docs.prismai.sh"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-accent/10 text-lg px-8 flex items-center gap-2"
            >
              View Docs
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Zero-Trust Architecture</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>SOC2 Roadmap</span>
          </div>
        </div>
      </div>
    </div>
  );
}
