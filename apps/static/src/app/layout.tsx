import type { ReactNode } from "react";
import { Space_Mono } from "next/font/google";
import { Toaster } from "@howmanyat/ui/components/ui/sonner";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "At's Room",
  description: "个人邮箱地址管理工具",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN" className={spaceMono.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=localStorage.getItem("howmanyat-theme");if(d==="dark"||(!d&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch{}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
