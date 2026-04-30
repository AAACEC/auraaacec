import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import { MainHeader } from "@/components/main-header";

const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"], 
  variable: "--font-bricolage",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: "%s | AurAAACEC",
    default: "AurAAACEC",
  },
  description: "O Campeonato Oficial de Aura da AAACEC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={bricolage.variable}>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <MainHeader />
          <main className="flex-1">{children}</main>
          <Toaster position="top-center" richColors />
        </div>
      </body>
    </html>
  );
}
