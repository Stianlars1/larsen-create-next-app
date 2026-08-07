import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{APP_NAME}}",
  description: "Built with the Larsen Utvikling Next.js template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
