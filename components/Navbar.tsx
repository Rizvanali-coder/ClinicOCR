"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Users, 
  UploadCloud, 
  LayoutDashboard, 
  Sparkles,
  ShieldCheck
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Upload & Analyze", href: "/upload", icon: UploadCloud },
    { name: "Prescription Records", href: "/prescriptions", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-healthcare-600 flex items-center justify-center text-white shadow-md shadow-healthcare-600/20 group-hover:bg-healthcare-700 transition">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">ClinicOCR</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-healthcare-100 text-healthcare-700 border border-healthcare-200">
                    AI DOC
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Medical Intelligence Platform</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-healthcare-50 text-healthcare-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-healthcare-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>HIPAA-Friendly Doctor Controlled</span>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-healthcare-600 hover:bg-healthcare-700 text-white text-sm font-semibold shadow-sm transition active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Digitize Prescription</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
