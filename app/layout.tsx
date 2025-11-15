import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyPebbles - ACON3D & CSP Asset Manager",
  description: "Organize and manage your digital assets from ACON3D, CSP, and more. Keep track of wishlists, organize by project, and never lose track of what you've bought!",
  icons: {
    icon: '/yuyu_mojis/yuwon_veryhappy.png',
    shortcut: '/yuyu_mojis/yuwon_veryhappy.png',
    apple: '/yuyu_mojis/yuwon_veryhappy.png',
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
        <link rel="icon" href="/yuyu_mojis/yuwon_veryhappy.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
