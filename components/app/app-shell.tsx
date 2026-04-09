"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles } from "lucide-react";
import { ReactNode, useState } from "react";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  userEmail: string;
  children: ReactNode;
}

function SidebarContent({ userEmail }: { userEmail: string }) {
  return (
    <>
      <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">JobSpark AI</p>
          <p className="text-[11px] text-sidebar-foreground/50">Smart job search</p>
        </div>
      </Link>
      <SidebarNav />
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <p className="text-[11px] text-sidebar-foreground/40 uppercase tracking-wider">Signed in</p>
        <p className="mt-1 truncate text-xs text-sidebar-foreground/80">{userEmail}</p>
        <form action="/api/auth/logout" method="post" className="mt-3">
          <Button type="submit" variant="ghost" size="sm" className="w-full h-8 text-xs text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent">
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
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border px-3 py-4">
        <SidebarContent userEmail={userEmail} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 h-12 flex items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur-sm px-4">
          <Button type="button" variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-enter">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.aside
              className="flex h-full w-[260px] flex-col bg-sidebar px-3 py-4"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
