import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardNav } from "./_components/DashboardNav";

const links = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/departments", label: "系" },
  { href: "/dashboard/students", label: "学生" },
  { href: "/dashboard/staff", label: "教职工" },
  { href: "/dashboard/courses", label: "课程" },
  { href: "/dashboard/enrollments", label: "选课" },
  { href: "/dashboard/grades", label: "成绩" },
  { href: "/dashboard/reports", label: "报表" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold">
              EduMgr
            </Link>
            <nav className="hidden gap-3 text-sm text-muted-foreground md:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <DashboardNav />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
    </div>
  );
}

