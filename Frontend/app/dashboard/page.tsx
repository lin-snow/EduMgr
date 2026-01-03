"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getUser, type User, type UserRole, type Enrollment } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileSpreadsheet,
  BarChart3,
  ArrowRight,
  BookMarked,
  ListChecks,
  Award,
  Clock
} from "lucide-react";

type Stats = {
  departments: number;
  students: number;
  staff: number;
  courses: number;
};

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  roles: UserRole[];
};

// 根据角色配置不同的功能入口
const allLinks: NavLink[] = [
  // 管理员专属
  { href: "/dashboard/departments", label: "系管理", icon: Building2, desc: "院系信息的增删改查", roles: ["admin"] },
  { href: "/dashboard/students", label: "学生管理", icon: Users, desc: "学生信息、毕业、转学", roles: ["admin"] },
  { href: "/dashboard/staff", label: "教职工管理", icon: GraduationCap, desc: "教师信息管理", roles: ["admin"] },
  { href: "/dashboard/courses", label: "课程管理", icon: BookOpen, desc: "课程信息维护", roles: ["admin"] },
  { href: "/dashboard/enrollments", label: "选课管理", icon: ClipboardList, desc: "学期、选课、退课", roles: ["admin"] },
  // 管理员和教师
  { href: "/dashboard/grades", label: "成绩管理", icon: FileSpreadsheet, desc: "成绩录入与查询", roles: ["admin", "teacher"] },
  { href: "/dashboard/reports", label: "统计报表", icon: BarChart3, desc: "登记表、成绩报表", roles: ["admin", "teacher"] },
  // 学生专属
  { href: "/dashboard/my-courses", label: "课程选课", icon: BookMarked, desc: "浏览课程、点击选课", roles: ["student"] },
  { href: "/dashboard/my-enrollments", label: "我的选课", icon: ListChecks, desc: "查看已选课程、退课", roles: ["student"] },
  { href: "/dashboard/my-grades", label: "我的成绩", icon: Award, desc: "查看各科成绩", roles: ["student"] },
];

const roleLabels: Record<string, string> = {
  admin: "管理员",
  teacher: "教师",
  student: "学生",
};

type MyGrade = {
  course_no: string;
  course_name: string;
  credits: number;
  term_code: string;
  usual_score: number | null;
  exam_score: number | null;
  final_score: number | null;
};

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  // 学生专属数据
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [studentGrades, setStudentGrades] = useState<MyGrade[]>([]);

  useEffect(() => {
    const cachedUser = getUser();
    if (cachedUser) {
      setUser(cachedUser);

      if (cachedUser.role === "admin") {
        // 管理员加载统计数据
        loadAdminStats();
      } else if (cachedUser.role === "student") {
        // 学生加载自己的数据
        loadStudentData();
      }
    }
  }, []);

  async function loadAdminStats() {
    try {
      const [depts, students, staff, courses] = await Promise.all([
        apiFetch<unknown[]>("/api/v1/departments"),
        apiFetch<unknown[]>("/api/v1/students"),
        apiFetch<unknown[]>("/api/v1/staff"),
        apiFetch<unknown[]>("/api/v1/courses"),
      ]);

      setStats({
        departments: Array.isArray(depts.data) ? depts.data.length : 0,
        students: Array.isArray(students.data) ? students.data.length : 0,
        staff: Array.isArray(staff.data) ? staff.data.length : 0,
        courses: Array.isArray(courses.data) ? courses.data.length : 0,
      });
    } catch {
      // 忽略错误
    }
  }

  async function loadStudentData() {
    try {
      const [enrollRes, gradesRes] = await Promise.all([
        apiFetch<Enrollment[]>("/api/v1/enrollments/my"),
        apiFetch<MyGrade[]>("/api/v1/grades/my"),
      ]);

      if (enrollRes.code === 0) {
        // Backend returns array directly
        setStudentEnrollments(enrollRes.data ?? []);
      }
      if (gradesRes.code === 0) {
        setStudentGrades(gradesRes.data ?? []);
      }
    } catch {
      // 忽略错误
    }
  }

  // 根据角色过滤链接
  const visibleLinks = allLinks.filter((link) => {
    if (!user) return false;
    return link.roles.includes(user.role);
  });

  // 学生统计
  const studentStats = {
    enrolledCount: studentEnrollments.length,
    totalCredits: studentEnrollments.reduce((sum, e) => sum + (e.credits || 0), 0),
    avgScore: studentGrades.length > 0
      ? Math.round(
          studentGrades.filter((g) => g.final_score != null).reduce((sum, g) => sum + (g.final_score || 0), 0) /
            studentGrades.filter((g) => g.final_score != null).length
        )
      : 0,
    passedCount: studentGrades.filter((g) => g.final_score != null && g.final_score >= 60).length,
  };

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

      {/* 管理员数据概览 */}
      {user?.role === "admin" && stats && (
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

      {/* 学生数据概览 */}
      {user?.role === "student" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已选课程</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats.enrolledCount} 门</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已选学分</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${studentStats.totalCredits > 15 ? "text-destructive" : ""}`}>
                {studentStats.totalCredits}/15
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                studentStats.avgScore >= 90 ? "text-green-600" :
                studentStats.avgScore >= 60 ? "text-yellow-600" :
                studentStats.avgScore > 0 ? "text-destructive" : ""
              }`}>
                {studentStats.avgScore || "-"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已获学分</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {studentGrades.reduce((sum, g) => sum + (g.credits || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 功能入口 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {user?.role === "student" ? "快捷入口" : "功能模块"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleLinks.map((l) => (
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

      {/* 系统说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {user?.role === "student" ? "使用提示" : "系统说明"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {user?.role === "student" ? (
            <ul className="list-inside list-disc space-y-1">
              <li>点击「课程选课」浏览所有可选课程，直接点击选课按钮即可选修</li>
              <li>每学期选课总学分不超过 15 学分</li>
              <li>在「我的选课」页面可以查看已选课程并进行退课操作</li>
              <li>在「我的成绩」页面可以查看各科成绩和统计信息</li>
            </ul>
          ) : user?.role === "teacher" ? (
            <ul className="list-inside list-disc space-y-1">
              <li>在「成绩管理」页面可以录入和修改您所授课程的学生成绩</li>
              <li>在「统计报表」页面可以导出成绩登记表和成绩报表</li>
              <li>成绩录入支持按课程批量录入或按学生单独录入</li>
            </ul>
          ) : (
            <ul className="list-inside list-disc space-y-1">
              <li>本系统为教学管理系统，支持学生、教职工、系、课程、选课及成绩的完整管理</li>
              <li>权限说明：管理员可执行所有操作；教师可录入/修改自己课程的成绩；学生可查询自己的信息</li>
              <li>选课约束：每学期选课总学分不超过 15 学分</li>
              <li>成绩查询：按课程分组显示，每门课程内按总评成绩从高到低排序</li>
              <li>报表功能：支持成绩登记表（空白）和成绩报表（含分段统计）的输出</li>
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
