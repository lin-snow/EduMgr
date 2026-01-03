"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getUser, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileSpreadsheet,
  BarChart3,
  ArrowRight
} from "lucide-react";

type Stats = {
  departments: number;
  students: number;
  staff: number;
  courses: number;
  enrollments: number;
  grades: number;
};

const links = [
  { href: "/dashboard/departments", label: "系管理", icon: Building2, desc: "院系信息的增删改查" },
  { href: "/dashboard/students", label: "学生管理", icon: Users, desc: "学生信息、毕业、转学" },
  { href: "/dashboard/staff", label: "教职工管理", icon: GraduationCap, desc: "教师信息管理" },
  { href: "/dashboard/courses", label: "课程管理", icon: BookOpen, desc: "课程信息维护" },
  { href: "/dashboard/enrollments", label: "选课管理", icon: ClipboardList, desc: "学期、选课、退课" },
  { href: "/dashboard/grades", label: "成绩管理", icon: FileSpreadsheet, desc: "成绩录入与查询" },
  { href: "/dashboard/reports", label: "统计报表", icon: BarChart3, desc: "登记表、成绩报表" },
];

const roleLabels: Record<string, string> = {
  admin: "管理员",
  teacher: "教师",
  student: "学生",
};

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const cachedUser = getUser();
    if (cachedUser) setUser(cachedUser);

    // 尝试加载统计数据
    async function loadStats() {
      try {
        const [depts, students, staff, courses] = await Promise.all([
          apiFetch<{ total?: number; items?: unknown[] }>("/api/v1/departments"),
          apiFetch<{ total?: number; items?: unknown[] }>("/api/v1/students"),
          apiFetch<{ total?: number; items?: unknown[] }>("/api/v1/staff"),
          apiFetch<{ total?: number; items?: unknown[] }>("/api/v1/courses"),
        ]);

        setStats({
          departments: depts.data && Array.isArray(depts.data) ? depts.data.length : 0,
          students: students.data && Array.isArray(students.data) ? students.data.length : 0,
          staff: staff.data && Array.isArray(staff.data) ? staff.data.length : 0,
          courses: courses.data && Array.isArray(courses.data) ? courses.data.length : 0,
          enrollments: 0,
          grades: 0,
        });
      } catch {
        // 忽略错误
      }
    }
    void loadStats();
  }, []);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {user ? `欢迎回来，${user.username}` : "管理面板"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? (
            <>
              当前身份：
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {roleLabels[user.role] || user.role}
              </span>
            </>
          ) : (
            "请先登录以获取完整功能"
          )}
        </p>
      </div>

      {/* 数据概览 */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">院系数量</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">学生人数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">教职工人数</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.staff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">课程数量</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courses}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 功能入口 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">功能模块</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="group cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <l.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <CardTitle className="text-base">{l.label}</CardTitle>
                  <CardDescription>{l.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 快速说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">系统说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>本系统为教学管理系统，支持学生、教职工、系、课程、选课及成绩的完整管理</li>
            <li>权限说明：管理员可执行所有操作；教师可录入/修改自己课程的成绩；学生可查询自己的信息</li>
            <li>选课约束：每学期选课总学分不超过 15 学分</li>
            <li>成绩查询：按课程分组显示，每门课程内按总评成绩从高到低排序</li>
            <li>报表功能：支持成绩登记表（空白）和成绩报表（含分段统计）的输出</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
