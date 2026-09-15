import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextCart 商城",
  description: "NextCart — 全栈电商平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
