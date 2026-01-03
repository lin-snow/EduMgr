"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, BarChart3, Download, Search } from "lucide-react";

type Student = {
  student_no: string;
  name: string;
  gender: string;
  usual_score?: number | null;
  exam_score?: number | null;
  final_score?: number | null;
};

type Dist = {
  ge90_count: number;
  ge90_rate: number;
  ge80_count: number;
  ge80_rate: number;
  ge70_count: number;
  ge70_rate: number;
  ge60_count: number;
  ge60_rate: number;
  lt60_count: number;
  lt60_rate: number;
};

type CourseReport = {
  course_no: string;
  course_name: string;
  teacher_no: string;
  teacher_name: string;
  hours: number;
  credits: number;
  class_time: string;
  class_location: string;
  exam_time: string;
  students: Student[];
  dist?: Dist;
};

export default function ReportsPage() {
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"roster" | "report">("roster");
  const [items, setItems] = useState<CourseReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [courseNo, setCourseNo] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [deptNo, setDeptNo] = useState("");

  async function load() {
    setErr(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (courseNo) qs.set("course_no", courseNo);
    if (courseName) qs.set("course_name", courseName);
    if (teacherName) qs.set("teacher_name", teacherName);
    if (deptNo) qs.set("dept_no", deptNo);
    const path =
      mode === "roster"
        ? `/api/v1/reports/grade-roster?${qs.toString()}`
        : `/api/v1/reports/grade-report?${qs.toString()}`;
    const res = await apiFetch<CourseReport[]>(path);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const totalStudents = items.reduce((sum, c) => sum + (c.students?.length ?? 0), 0);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">统计报表（Reports）</h1>
        <div className="flex gap-2">
          <Button
            variant={mode === "roster" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("roster")}
          >
            <FileText className="mr-2 h-4 w-4" />
            成绩登记表
          </Button>
          <Button
            variant={mode === "report" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("report")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            成绩报表
          </Button>
        </div>
      </div>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <Section title="筛选条件（PRD 5.1/5.2）">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="course_no">课程号</Label>
              <Input
                id="course_no"
                placeholder="如：C001"
                value={courseNo}
                onChange={(e) => setCourseNo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course_name">课程名</Label>
              <Input
                id="course_name"
                placeholder="如：数据库原理"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher_name">教师姓名</Label>
              <Input
                id="teacher_name"
                placeholder="如：张三"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dept_no">系号（教师所属）</Label>
              <Input
                id="dept_no"
                placeholder="如：D001"
                value={deptNo}
                onChange={(e) => setDeptNo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => void load()} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "查询中..." : "查询"}
            </Button>
            <span className="text-sm text-muted-foreground">
              共 {items.length} 门课程 / {totalStudents} 名学生
            </span>
          </div>
        </div>
      </Section>

      <Section 
        title={mode === "roster" ? "成绩登记表输出" : "成绩报表输出"}
        description={mode === "roster" ? "空白登记表，用于打印后手工填写成绩。如需查看已录入成绩，请切换到「成绩报表」" : "显示已录入成绩及分段统计"}
      >
        <div className="grid gap-6">
          {items.map((c) => (
            <div key={c.course_no} className="rounded-lg border border-border bg-card print:break-inside-avoid">
              {/* 课程信息头部 */}
              <div className="border-b border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      <span className="font-mono">{c.course_no}</span>
                      <span className="ml-2">{c.course_name}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      任课教师：<span className="font-mono">{c.teacher_no}</span> {c.teacher_name}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">
                      学时：{c.hours}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">
                      学分：{c.credits}
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>上课时间：{c.class_time || "-"}</div>
                  <div>上课地点：{c.class_location || "-"}</div>
                  <div>考试时间：{c.exam_time || "-"}</div>
                  <div>选课人数：{c.students?.length ?? 0} 人</div>
                </div>
              </div>

              {/* 分段统计（仅报表模式） */}
              {mode === "report" && c.dist && (
                <div className="border-b border-border bg-muted/10 p-4">
                  <div className="mb-2 text-sm font-semibold">分段统计</div>
                  <div className="grid gap-2 text-sm sm:grid-cols-5">
                    <div className="flex items-center justify-between rounded-lg bg-green-50 p-2">
                      <span className="text-green-700">≥90 优秀</span>
                      <span className="font-mono font-semibold text-green-800">
                        {c.dist.ge90_count} ({(c.dist.ge90_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2">
                      <span className="text-blue-700">≥80 良好</span>
                      <span className="font-mono font-semibold text-blue-800">
                        {c.dist.ge80_count} ({(c.dist.ge80_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-2">
                      <span className="text-yellow-700">≥70 中等</span>
                      <span className="font-mono font-semibold text-yellow-800">
                        {c.dist.ge70_count} ({(c.dist.ge70_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-orange-50 p-2">
                      <span className="text-orange-700">≥60 及格</span>
                      <span className="font-mono font-semibold text-orange-800">
                        {c.dist.ge60_count} ({(c.dist.ge60_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-red-50 p-2">
                      <span className="text-red-700">&lt;60 不及格</span>
                      <span className="font-mono font-semibold text-red-800">
                        {c.dist.lt60_count} ({(c.dist.lt60_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 学生名单及成绩 */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>学号（升序）</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead className="text-right">平时成绩</TableHead>
                      <TableHead className="text-right">考试成绩</TableHead>
                      <TableHead className="text-right">总评成绩</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.students.map((s, idx) => (
                      <TableRow key={s.student_no}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono">{s.student_no}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.gender}</TableCell>
                        <TableCell className="text-right">
                          {mode === "roster" ? (
                            <span className="text-muted-foreground">____</span>
                          ) : (
                            s.usual_score ?? "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {mode === "roster" ? (
                            <span className="text-muted-foreground">____</span>
                          ) : (
                            s.exam_score ?? "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {mode === "roster" ? (
                            <span className="text-muted-foreground">____</span>
                          ) : (
                            <span className={`font-semibold ${
                              (s.final_score ?? 0) >= 90 ? "text-green-600" :
                              (s.final_score ?? 0) >= 60 ? "text-foreground" :
                              s.final_score != null ? "text-destructive" : ""
                            }`}>
                              {s.final_score ?? "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {c.students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          暂无选课学生
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              暂无报表数据，请调整筛选条件
            </div>
          )}
        </div>
      </Section>

      {items.length > 0 && (
        <div className="flex justify-end print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            打印/导出
          </Button>
        </div>
      )}
    </main>
  );
}
