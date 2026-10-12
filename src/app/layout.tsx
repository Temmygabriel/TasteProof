import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteProof — Recommendation QA",
  description: "A taste QA layer for AI agents. Test recommendations against live Qloo cultural-intelligence signals and inspect the evidence.",
  applicationName: "TasteProof",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
