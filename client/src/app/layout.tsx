import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Project Submission Portal",
  description: "Submit and review student projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-background text-foreground font-sans antialiased relative selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        {/* Subtle Ambient Depth Canvas for Glassmorphism Refraction */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
        >
          <div className="absolute -top-[20%] left-[50%] -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-gradient-to-tr from-primary/12 via-primary/5 to-transparent blur-[110px] opacity-70 dark:opacity-40" />
          <div className="absolute top-[45%] -right-[15%] w-[650px] h-[550px] rounded-full bg-gradient-to-bl from-accent/10 via-primary/5 to-transparent blur-[130px] opacity-60 dark:opacity-25" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[450px] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-[120px] opacity-50 dark:opacity-20" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
