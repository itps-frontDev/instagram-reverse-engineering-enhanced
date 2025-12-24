import type { Metadata } from "next";
import { Geist, Geist_Mono, Lobster_Two } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instagram",
});

export const metadata: Metadata = {
  title: "Instagram Clone",
  description: "Instagram reverse engineering project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
