import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AnalyticsInit from "@/components/AnalyticsInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timeline Diary - Sua agenda visual",
  description: "Visualize suas atividades diárias em uma timeline interativa e compartilhável",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Timeline Diary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="touch-manipulation">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen safe-area-padding`}
      >
        <AuthProvider>
          <AnalyticsInit />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
