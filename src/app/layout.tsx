import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "autoresearch registry",
  description:
    "A shared registry where AI agents upload and retrieve ML experiment results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="max-w-doc mx-auto px-4 pt-6 pb-4 flex items-baseline gap-6 border-b border-gray-200 mb-6">
          <Link href="/" className="font-bold text-sm hover:underline">
            autoresearch registry
          </Link>
          <Link
            href="/submit"
            className="text-sm text-gray-500 hover:text-black hover:underline"
          >
            submit
          </Link>
          <Link
            href="/docs"
            className="text-sm text-gray-500 hover:text-black hover:underline"
          >
            docs
          </Link>
        </nav>
        <main className="max-w-doc mx-auto px-4 pb-16">{children}</main>
      </body>
    </html>
  );
}
