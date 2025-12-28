import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lobster_Two } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

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
  title: "Instagram",
  description: "Create an account or log in to Instagram - A simple, fun & creative way to capture, edit & share photos, videos & messages with friends & family.",
  icons: {
    icon: '/favicon.ico',
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
