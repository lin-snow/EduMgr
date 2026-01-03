"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, BookOpen, Calculator } from "lucide-react";

type MyGrade = {
  course_no: string;
  course_name: string;
  credits: number;
  term_code: string;
  usual_score: number | null;
  exam_score: number | null;
  final_score: number | null;
};

export default function MyGradesPage() {
  const [grades, setGrades] = useState<MyGrade[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMyGrades() {
    setLoading(true);
    setErr(null);
    const res = await apiFetch<MyGrade[]>("/api/v1/grades/my");
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setGrades(res.data ?? []);
  }

  useEffect(() => {
    void loadMyGrades();
  }, []);

  // 计算统计数据
  const stats = {
    totalCourses: grades.length,
    totalCredits: grades.reduce((sum, g) => sum + (g.credits || 0), 0),
    avgScore: grades.length > 0
      ? Math.round(
          grades.filter((g) => g.final_score != null).reduce((sum, g) => sum + (g.final_score || 0), 0) /
            grades.filter((g) => g.final_score != null).length
        )
      : 0,
    passedCount: grades.filter((g) => g.final_score != null && g.final_score >= 60).length,
  };

  // 按学期分组
  const groupedByTerm: Record<string, MyGrade[]> = {};
  grades.forEach((g) => {
    const key = g.term_code || "未知学期";
    if (!groupedByTerm[key]) groupedByTerm[key] = [];
    groupedByTerm[key].push(g);
  });

  // 成绩颜色
  const scoreColor = (score: number | null) => {
    if (score == null) return "text-muted-foreground";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">我的成绩</h1>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已修课程</p>
                <p className="text-2xl font-bold">{stats.totalCourses} 门</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已获学分</p>
                <p className="text-2xl font-bold">{stats.totalCredits}</p>
              </div>
              <Award className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均成绩</p>
                <p className={`text-2xl font-bold ${scoreColor(stats.avgScore)}`}>
                  {stats.avgScore || "-"}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">通过率</p>
                <p className="text-2xl font-bold text-green-600">
                  {grades.filter((g) => g.final_score != null).length > 0
                    ? Math.round((stats.passedCount / grades.filter((g) => g.final_score != null).length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">加载中...</div>
      ) : grades.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">暂无成绩记录</div>
      ) : (
        Object.entries(groupedByTerm).map(([term, termGrades]) => (
          <Section key={term} title={`${term} 学期`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程号</TableHead>
                  <TableHead>课程名称</TableHead>
                  <TableHead>学分</TableHead>
                  <TableHead className="text-center">平时成绩</TableHead>
                  <TableHead className="text-center">期末成绩</TableHead>
                  <TableHead className="text-center">总评成绩</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termGrades.map((g, idx) => (
                  <TableRow key={`${g.course_no}-${idx}`}>
                    <TableCell className="font-mono">{g.course_no}</TableCell>
                    <TableCell>{g.course_name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                        {g.credits || 0} 学分
                      </span>
                    </TableCell>
                    <TableCell className={`text-center font-medium ${scoreColor(g.usual_score)}`}>
                      {g.usual_score ?? "-"}
                    </TableCell>
                    <TableCell className={`text-center font-medium ${scoreColor(g.exam_score)}`}>
                      {g.exam_score ?? "-"}
                    </TableCell>
                    <TableCell className={`text-center font-bold ${scoreColor(g.final_score)}`}>
                      {g.final_score != null ? (
                        <span className={`rounded px-2 py-0.5 ${
                          g.final_score >= 60 ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {g.final_score}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        ))
      )}
    </main>
  );
}
