import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteProof — Real Recommendations, Backed by Taste",
  description: "Test whether an AI agent’s recommendations fit the taste context it was given. TasteProof uses live Qloo cultural-intelligence data to show evidence, rankings and transparent verdicts.",
  applicationName: "TasteProof",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
