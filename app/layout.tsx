import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "roamer",
  description: "A personal AI travel copilot built around a living travel map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
