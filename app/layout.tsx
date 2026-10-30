import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ClinicOCR - AI Medical Document Intelligence Platform",
  description: "Convert handwritten prescriptions into structured, searchable digital records with Tesseract OCR & Google Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          ClinicOCR &bull; Phase 1 & 2 Medical SaaS &bull; Tesseract OCR + Google Gemini Flash
        </footer>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
