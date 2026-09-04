import type { Metadata } from "next";
import "./globals.css";
import { TripProvider } from "@/context/TripContext";

export const metadata: Metadata = {
  title: "旅費わりかん | Trip Splitter",
  description: "友人との旅行費用を精算するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <TripProvider>{children}</TripProvider>
      </body>
    </html>
  );
}
