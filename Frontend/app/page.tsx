"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, FileSpreadsheet, ArrowRight, Settings } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "学生信息管理",
    desc: "支持新增、修改、删除学生信息，以及毕业、转学处理",
  },
  {
    icon: GraduationCap,
    title: "教职工管理",
    desc: "管理教师信息、职称、专业方向等",
  },
  {
    icon: BookOpen,
    title: "课程与选课",
    desc: "课程管理、学期选课，自动校验学分上限",
  },
  {
    icon: FileSpreadsheet,
    title: "成绩与报表",
    desc: "成绩录入、查询、统计报表输出",
  },
];

export default function HomePage() {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch(`${apiBase()}/auth/setup`);
        const json = await res.json();
        if (json.code === 0) {
          setSetupRequired(json.data?.setup_required ?? false);
        }
      } catch {
        // 忽略错误
      }
    }
    void checkSetup();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="flex items-center gap-3 text-primary">
            <GraduationCap className="h-10 w-10" />
            <span className="text-3xl font-bold">EduMgr</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            教学管理系统
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            一个完整的教学管理解决方案，支持学生、教职工、院系、课程、选课及成绩的统一管理与查询，
            提升信息化水平，减少人工操作错误。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {setupRequired === true ? (
              <Button size="lg" asChild>
                <Link href="/setup">
                  <Settings className="mr-2 h-4 w-4" />
                  初始化系统
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/login">
                  登录系统
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">进入管理面板</Link>
            </Button>
          </div>
          {setupRequired === true && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <strong>提示：</strong>系统尚未初始化，请先创建管理员账号。
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold">核心功能</h2>
        <p className="mt-2 text-muted-foreground">
          覆盖高校教学管理的核心数据对象与典型业务流程
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-xl font-semibold">技术栈</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {["Next.js", "React", "TailwindCSS", "Shadcn UI", "Go", "Echo", "GORM", "PostgreSQL"].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-muted-foreground">
          EduMgr - 数据库课程设计项目
        </div>
      </footer>
    </main>
  );
}
