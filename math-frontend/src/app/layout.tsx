import "./globals.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { DM_Mono } from 'next/font/google';
import { cn } from "@/lib/utils";
import { ClientBody } from "./ClientBody";

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-geist',
});

const mono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: "ForAI | AI-Focused Design Studio",
  description:
    "A creative design studio for AI companies. ForAI designs AI products, systems, agents, automations, and generative AI experiences that inspire, connect, and spark creativity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "bg-white antialiased",
        sans.variable,
        mono.variable
      )}
    >
      <body className={`min-h-screen bg-forai-light text-forai-dark ${sans.className}`}>
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
