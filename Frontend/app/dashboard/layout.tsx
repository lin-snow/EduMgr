import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardNav } from "./_components/DashboardNav";
import { RoleBasedNav } from "./_components/RoleBasedNav";
import { GraduationCap } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <GraduationCap className="h-6 w-6" />
              <span className="hidden sm:inline">EduMgr</span>
            </Link>
            <RoleBasedNav />
          </div>
          <DashboardNav />
        </div>
        {/* 移动端导航 */}
        <div className="border-t border-border px-4 py-2 lg:hidden">
          <RoleBasedNav mobile />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
