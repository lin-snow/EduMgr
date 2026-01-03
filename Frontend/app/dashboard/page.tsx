import Link from "next/link";

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
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">管理面板</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          先把功能跑通：CRUD / 选课 / 成绩 / 报表（对齐 PRD）。
        </p>
        <div className="mt-6 grid gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md border border-border bg-card p-4 hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

