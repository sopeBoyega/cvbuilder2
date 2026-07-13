import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html
        lang="en"
        className={cn(
          "h-full",
          "dark",
          "font-sans",
          "antialiased",
          inter.variable,
          spaceGrotesk.variable,
          jetBrainsMono.variable,
        )}
      >
        <body className="min-h-full flex flex-col">
          <AnalyticsProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
