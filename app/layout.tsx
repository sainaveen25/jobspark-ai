import type { Metadata } from "next";

import "@/app/globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "JobSpark AI",
  description: "AI-first job search assistant with profile intelligence, resume tailoring, and application tracking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
