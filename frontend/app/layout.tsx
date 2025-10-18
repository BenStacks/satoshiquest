import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "⚡ Satoshi's Quest - Bitcoin-Powered Roguelike",
  description: "Enter the depths of Satoshi's dungeon in this Bitcoin-powered roguelike adventure. Fight monsters, collect NFT loot, and risk real Bitcoin for resurrection. Every death is permanent, every victory is earned.",
  keywords: ["Bitcoin", "Stacks", "sBTC", "NFT", "Roguelike", "Blockchain Game", "Web3"],
  authors: [{ name: "Satoshi's Quest Team" }],
  openGraph: {
    title: "⚡ Satoshi's Quest - Bitcoin-Powered Roguelike",
    description: "The first Bitcoin-secured roguelike where death is permanent and victory is earned.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${
          geistSans.variable
        } ${geistMono.variable} ${
          orbitron.variable
        } ${inter.variable} font-inter antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
