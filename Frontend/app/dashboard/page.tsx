import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "./_components/Section";

const links = [
  { href: "/dashboard/departments", label: "系管理（Departments）" },
  { href: "/dashboard/students", label: "学生管理（Students）" },
  { href: "/dashboard/staff", label: "教职工管理（Staff）" },
  { href: "/dashboard/courses", label: "课程管理（Courses）" },
  { href: "/dashboard/enrollments", label: "选课管理（Enrollments）" },
  { href: "/dashboard/grades", label: "成绩管理（Grades）" },
  { href: "/dashboard/reports", label: "统计报表（Reports）" },
];

export default function DashboardHome() {
  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">管理面板</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          先把功能跑通：CRUD / 选课 / 成绩 / 报表（对齐 PRD）。
        </p>
      </div>

      <Section title="功能入口">
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <Button key={l.href} variant="outline" className="justify-start" asChild>
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
        </div>
      </Section>
    </main>
  );
}

