import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/settings/themeProvider";
import { LMSettingsProvider } from "@/components/settings/lmSettingsProvider";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "How Language Models Work",
  description:
    "A simple and explorative breakdown of language models and their components. Look into the box and get a visual and intuitive understanding of language models and their operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LMSettingsProvider>
            {children}
          </LMSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
