import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "../styles/globals.css";

const satoshi = localFont({
  src: "./fonts/satoshi/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

const clashDisplay = localFont({
  src: "./fonts/clash-display/ClashDisplay-Variable.woff2",
  variable: "--font-clash-display",
  weight: "200 700",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vis-mark-two.vercel.app"),
  title: "VisMark — Visual Bookmark Manager",
  description:
    "Save links as visual screenshot cards. Organize with folders, tags, and sharing.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "VisMark — Visual Bookmark Manager",
    description:
      "Save links as visual screenshot cards. Organize with folders, tags, and sharing.",
    url: "https://vis-mark-two.vercel.app",
    siteName: "VisMark",
    images: [
      {
        url: "/og-image.png",
      },
    ],
  },
};

const themeScript = `(function(){try{var s=localStorage.getItem('vismark-theme');var t=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${satoshi.variable} ${clashDisplay.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

