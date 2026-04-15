import type { ReactNode } from "react";
import { cookies } from "next/headers";
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

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  const isDark = theme === "dark";

  return (
    <html lang="zh-CN" className={`${spaceMono.variable} ${isDark ? "dark" : ""}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
