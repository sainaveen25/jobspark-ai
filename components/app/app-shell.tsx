"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, Sparkles } from "lucide-react";
import { ReactNode, useState } from "react";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppShellProps {
  userEmail: string;
  children: ReactNode;
}

function SidebarContent({ userEmail }: { userEmail: string }) {
  return (
    <>
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 shadow-inner shadow-white/10">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold tracking-wide text-white">JobSpark AI</p>
          <p className="text-xs text-sidebar-foreground/60">Search smarter, apply faster</p>
        </div>
      </Link>
      <SidebarNav />
      <div className="mt-auto rounded-3xl border border-white/10 bg-white/6 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/50">Signed in</p>
        <p className="mt-2 truncate text-sm text-white">{userEmail}</p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <Button type="submit" variant="secondary" className="w-full rounded-2xl bg-white/12 text-white hover:bg-white/18">
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}

export function AppShell({ userEmail, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1600px] gap-4 lg:gap-6">
        <aside className="glass hidden w-[280px] shrink-0 rounded-[28px] bg-sidebar px-4 py-5 text-sidebar-foreground md:flex md:flex-col">
          <SidebarContent userEmail={userEmail} />
        </aside>
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-4">
          <header className="glass panel-grid sticky top-4 z-40 rounded-[28px] px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="icon" className="rounded-full md:hidden" onClick={() => setOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="relative hidden flex-1 md:block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  readOnly
                  value="Profile-aware search, resume tailoring, and job orchestration"
                  className="h-12 rounded-full border-white/30 bg-white/60 pl-11 text-sm shadow-none dark:bg-white/5"
                />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="animate-enter flex-1 rounded-[32px] pb-6">{children}</main>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-slate-950/45 p-4 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              className="glass flex h-full max-w-[300px] flex-col rounded-[28px] bg-sidebar p-4 text-sidebar-foreground"
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -28, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent userEmail={userEmail} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
