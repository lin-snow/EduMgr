import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardNav } from "./_components/DashboardNav";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileSpreadsheet,
  BarChart3,
  LayoutDashboard
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "概览", icon: LayoutDashboard },
  { href: "/dashboard/departments", label: "系", icon: Building2 },
  { href: "/dashboard/students", label: "学生", icon: Users },
  { href: "/dashboard/staff", label: "教职工", icon: GraduationCap },
  { href: "/dashboard/courses", label: "课程", icon: BookOpen },
  { href: "/dashboard/enrollments", label: "选课", icon: ClipboardList },
  { href: "/dashboard/grades", label: "成绩", icon: FileSpreadsheet },
  { href: "/dashboard/reports", label: "报表", icon: BarChart3 },
];

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
            <nav className="hidden gap-1 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <DashboardNav />
        </div>
        {/* 移动端导航 */}
        <div className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
