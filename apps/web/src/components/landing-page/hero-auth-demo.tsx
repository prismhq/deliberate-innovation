"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Bell, Mail, Bookmark, User } from "lucide-react";

type Stage = 0 | 1 | 2;

export default function HeroAuthDemo() {
  const [stage, setStage] = useState<Stage>(0);
  const [typed, setTyped] = useState("");

  // stage 0: type the prompt
  useEffect(() => {
    if (stage !== 0) return;
    const msg = "Sign into x.com";
    let i = 0;
    const id = setInterval(() => {
      setTyped(msg.slice(0, i + 1));
      i++;
      if (i === msg.length) {
        clearInterval(id);
        setTimeout(() => setStage(1), 800);
      }
    }, 65);
    return () => clearInterval(id);
  }, [stage]);

  // Add replay logic - restart after stage 2 is complete
  useEffect(() => {
    if (stage === 2) {
      const replayTimer = setTimeout(() => {
        setStage(0);
        setTyped("");
      }, 4000); // Wait 4 seconds before replaying
      return () => clearTimeout(replayTimer);
    }
  }, [stage]);

  return (
    <div className="relative mx-auto w-full max-w-[840px]">
      <div className="rounded-2xl border border-white/20 bg-muted/30 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/20 px-4 py-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-red-400/80" />
          <span className="size-2 rounded-full bg-yellow-400/80" />
          <span className="size-2 rounded-full bg-green-400/80" />
          <span className="ml-3">Agent run · Login</span>
        </div>
        <div className="h-[420px] overflow-hidden">
          <AnimatePresence mode="wait">
            {stage === 0 && <Typing key="typing" text={typed} />}
            {stage === 1 && <Login key="login" onDone={() => setStage(2)} />}
            {stage === 2 && <Feed key="feed" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Typing({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full items-center justify-center"
    >
      <div className="rounded-xl border border-white/20 bg-background px-4 py-3 font-mono text-sm text-foreground">
        {text}
        <span className="ml-1 inline-block h-4 w-[1px] animate-pulse bg-foreground/70" />
      </div>
    </motion.div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"user" | "pass" | "mfa" | "done">("user");
  const [typedUser, setTypedUser] = useState("");
  const [typedPass, setTypedPass] = useState("");

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (phase === "user") {
      const user = "agent@prism.dev";
      let i = 0;
      timers.push(
        setInterval(() => {
          setTypedUser(user.slice(0, i + 1));
          i++;
          if (i === user.length) {
            clearInterval(timers[timers.length - 1]);
            setTimeout(() => setPhase("pass"), 600);
          }
        }, 50),
      );
    }

    if (phase === "pass") {
      const pass = "••••••••••••••••••";
      let i = 0;
      timers.push(
        setInterval(() => {
          setTypedPass(pass.slice(0, i + 1));
          i++;
          if (i === pass.length) {
            clearInterval(timers[timers.length - 1]);
            setTimeout(() => setPhase("mfa"), 600);
          }
        }, 50),
      );
    }

    if (phase === "mfa") {
      timers.push(
        setTimeout(() => {
          setPhase("done");
          onDone();
        }, 1200),
      );
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [phase, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full items-center justify-center"
    >
      <div className="w-[480px] rounded-lg border border-white/20 bg-background/50 p-5 backdrop-blur">
        <div className="mb-4 text-center text-base font-semibold text-foreground">
          Login to x.com
        </div>
        <label className="block text-[11px] text-muted-foreground">
          Username
        </label>
        <div
          className={`mt-1 min-h-[22px] rounded-md border px-2 py-1 font-mono text-xs transition-colors ${["user", "pass", "mfa", "done"].includes(phase) ? "border-primary/50 bg-background" : "border-white/20 bg-muted/20"}`}
        >
          {typedUser || <span className="opacity-30">|</span>}
        </div>
        <label className="mt-3 block text-[11px] text-muted-foreground">
          Password
        </label>
        <div
          className={`mt-1 min-h-[22px] rounded-md border px-2 py-1 font-mono text-xs transition-colors ${["pass", "mfa", "done"].includes(phase) ? "border-primary/50 bg-background" : "border-white/20 bg-muted/20"}`}
        >
          {typedPass || <span className="opacity-30">••••••••••••••••••</span>}
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          {phase === "mfa"
            ? "Sending MFA…"
            : phase === "done"
              ? "Authenticated!"
              : ""}
        </div>
        <button
          disabled
          className={`mt-4 w-full rounded-md px-3 py-2 text-xs font-medium ${phase === "done" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {phase === "done" ? "Authenticated" : "Sign in"}
        </button>
      </div>
    </motion.div>
  );
}

function Feed() {
  const posts = [
    {
      handle: "@prismauth",
      text: "Sessions persist across runs; MFA handled.",
    },
    { handle: "@agentbot", text: "No secrets leak into prompts or code." },
    {
      handle: "@developer",
      text: "Simple SDK & docs. Get started in minutes.",
    },
  ];

  const trends = [
    { topic: "Agent MFA", count: "2,341 posts" },
    { topic: "Browser Automation", count: "9,112 posts" },
    { topic: "Prism Auth", count: "1,028 posts" },
  ];

  const navItems = [
    { label: "Home", icon: Home },
    { label: "Explore", icon: Search },
    { label: "Notifications", icon: Bell },
    { label: "Messages", icon: Mail },
    { label: "Bookmarks", icon: Bookmark },
    { label: "Profile", icon: User },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full overflow-hidden relative"
    >
      <div className="relative grid h-full w-full grid-cols-[140px_minmax(0,1fr)_160px] overflow-hidden">
        {/* Left nav */}
        <aside className="border-r border-white/20 p-2 text-sm text-muted-foreground">
          <div className="mb-2 text-xl font-bold pl-2 text-foreground">x</div>
          <nav className="space-y-0">
            {navItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 cursor-pointer rounded-full px-2 py-1.5 hover:bg-muted/20"
              >
                <Icon className="h-3 w-3" />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Center timeline */}
        <main className="flex min-w-0 flex-col border-r border-white/20 relative">
          <div className="sticky top-0 z-10 border-b border-white/20 bg-background/60 px-4 py-3 backdrop-blur">
            <div className="text-base font-semibold text-foreground">Home</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {posts.map((p, i) => (
              <article key={i} className="border-b border-white/20 p-4">
                <div className="flex gap-3">
                  <div className="size-9 shrink-0 rounded-full bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {p.handle}
                      </span>
                      <span className="ml-1 text-muted-foreground/60">
                        · now
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-foreground">{p.text}</div>
                    <div className="mt-2 flex gap-6 text-[11px] text-muted-foreground">
                      <button className="hover:text-foreground/70">
                        Reply
                      </button>
                      <button className="hover:text-foreground/70">
                        Repost
                      </button>
                      <button className="hover:text-foreground/70">Like</button>
                      <button className="hover:text-foreground/70">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Session reused chip with drop animation - positioned relative to main column */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.6,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="pointer-events-none absolute left-[15%] top-4 z-50 rounded-md bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground shadow-lg whitespace-nowrap"
          >
            Session reused — no login needed
          </motion.div>
        </main>

        {/* Right rail */}
        <aside className="hidden p-2 text-sm lg:block text-muted-foreground">
          <div className="mb-2 rounded-full border border-white/20 bg-muted/20 px-2 py-1 text-xs">
            Search x
          </div>
          <div className="rounded-xl border border-white/20 bg-muted/20 p-2">
            <div className="mb-2 font-semibold text-foreground text-xs">
              Trends
            </div>
            <div className="space-y-2">
              {trends.map((t, i) => (
                <div key={i} className="text-[10px]">
                  <div className="text-muted-foreground">Trending</div>
                  <div className="font-medium text-foreground text-xs">
                    {t.topic}
                  </div>
                  <div className="text-muted-foreground/60">{t.count}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
