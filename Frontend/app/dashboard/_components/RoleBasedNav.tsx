"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, type UserRole } from "@/lib/api";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileSpreadsheet,
  BarChart3,
  LayoutDashboard,
  BookMarked,
  ListChecks,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // 哪些角色可以看到
};

// 所有导航链接配置
const allLinks: NavLink[] = [
  { href: "/dashboard", label: "概览", icon: LayoutDashboard, roles: ["admin", "teacher", "student"] },
  // 管理员专属
  { href: "/dashboard/departments", label: "系管理", icon: Building2, roles: ["admin"] },
  { href: "/dashboard/students", label: "学生管理", icon: Users, roles: ["admin"] },
  { href: "/dashboard/staff", label: "教职工管理", icon: GraduationCap, roles: ["admin"] },
  { href: "/dashboard/courses", label: "课程管理", icon: BookOpen, roles: ["admin"] },
  { href: "/dashboard/enrollments", label: "选课管理", icon: ClipboardList, roles: ["admin"] },
  // 管理员和教师
  { href: "/dashboard/grades", label: "成绩管理", icon: FileSpreadsheet, roles: ["admin", "teacher"] },
  { href: "/dashboard/reports", label: "统计报表", icon: BarChart3, roles: ["admin", "teacher"] },
  // 学生专属
  { href: "/dashboard/my-courses", label: "课程选课", icon: BookMarked, roles: ["student"] },
  { href: "/dashboard/my-enrollments", label: "我的选课", icon: ListChecks, roles: ["student"] },
  { href: "/dashboard/my-grades", label: "我的成绩", icon: Award, roles: ["student"] },
];

// 获取用户角色（同步）
function getUserRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const user = getUser();
  return user?.role ?? null;
}

export function RoleBasedNav({ className, mobile = false }: { className?: string; mobile?: boolean }) {
  const pathname = usePathname();
  const role = useMemo(() => getUserRole(), []);

  // 根据角色过滤链接
  const visibleLinks = allLinks.filter((link) => {
    if (!role) return false;
    return link.roles.includes(role);
  });

  if (mobile) {
    return (
      <div className={cn("flex gap-1 overflow-x-auto", className)}>
        {visibleLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname === l.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className={cn("hidden gap-1 lg:flex", className)}>
      {visibleLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === l.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <l.icon className="h-4 w-4" />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
