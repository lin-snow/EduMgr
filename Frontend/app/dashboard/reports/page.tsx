"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const [courseNo, setCourseNo] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [deptNo, setDeptNo] = useState("");

  async function load() {
    setErr(null);
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
    if (res.code !== 0) return setErr(res.message);
    setItems(res.data ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">统计报表（Reports）</h1>
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="筛选（PRD 5.1/5.2）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select value={mode} onValueChange={(v) => setMode(v === "report" ? "report" : "roster")}>
            <SelectTrigger>
              <SelectValue placeholder="选择报表类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roster">成绩登记表</SelectItem>
              <SelectItem value="report">成绩报表（含分段统计）</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="course_no" value={courseNo} onChange={(e) => setCourseNo(e.target.value)} />
          <Input placeholder="course_name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          <Input placeholder="teacher_name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
          <Input placeholder="dept_no（教师所属系）" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
          <div className="sm:col-span-4">
            <Button onClick={() => void load()}>
              查询
            </Button>
          </div>
        </div>
      </Section>

      <Section title="输出">
        <div className="grid gap-6">
          {items.map((c) => (
            <div key={c.course_no} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">
                  <span className="font-mono">{c.course_no}</span> {c.course_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  教师：<span className="font-mono">{c.teacher_no}</span> {c.teacher_name} / 学时 {c.hours} / 学分 {c.credits}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                上课：{c.class_time} @ {c.class_location}；考试：{c.exam_time}
              </div>

              {mode === "report" && c.dist ? (
                <div className="mt-4 grid gap-2 text-sm">
                  <div className="font-semibold">分段统计</div>
                  <div className="grid gap-1 text-muted-foreground sm:grid-cols-5">
                    <div>≥90：{c.dist.ge90_count}（{(c.dist.ge90_rate * 100).toFixed(1)}%）</div>
                    <div>≥80：{c.dist.ge80_count}（{(c.dist.ge80_rate * 100).toFixed(1)}%）</div>
                    <div>≥70：{c.dist.ge70_count}（{(c.dist.ge70_rate * 100).toFixed(1)}%）</div>
                    <div>≥60：{c.dist.ge60_count}（{(c.dist.ge60_rate * 100).toFixed(1)}%）</div>
                    <div>不及格：{c.dist.lt60_count}（{(c.dist.lt60_rate * 100).toFixed(1)}%）</div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学号（升序）</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead>平时</TableHead>
                      <TableHead>考试</TableHead>
                      <TableHead>总评</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.students.map((s) => (
                      <TableRow key={s.student_no}>
                        <TableCell className="font-mono">{s.student_no}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.gender}</TableCell>
                        <TableCell>{s.usual_score ?? "-"}</TableCell>
                        <TableCell>{s.exam_score ?? "-"}</TableCell>
                        <TableCell className="font-semibold">{s.final_score ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}

