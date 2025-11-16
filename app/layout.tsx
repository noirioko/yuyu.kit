import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/lib/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyPebbles - ACON3D & CSP Asset Manager",
  description: "Organize and manage your digital assets from ACON3D, CSP, and more. Keep track of wishlists, organize by project, and never lose track of what you've bought!",
  icons: {
    icon: '/images/favicon-pebbles.png',
    shortcut: '/images/favicon-pebbles.png',
    apple: '/images/favicon-pebbles.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/favicon-pebbles.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
