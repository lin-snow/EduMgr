"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type GradeRow = {
  student_no: string;
  student_name: string;
  gender: string;
  usual_score?: number | null;
  exam_score?: number | null;
  final_score?: number | null;
};

type CourseGroup = {
  course_no: string;
  course_name: string;
  teacher_no: string;
  teacher_name: string;
  hours: number;
  credits: number;
  class_time: string;
  class_location: string;
  exam_time: string;
  dept_no: string;
  rows: GradeRow[];
};

export default function GradesPage() {
  const [err, setErr] = useState<string | null>(null);
  const [groups, setGroups] = useState<CourseGroup[]>([]);

  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseNo, setCourseNo] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [deptNo, setDeptNo] = useState("");

  const [byCourseCourseNo, setByCourseCourseNo] = useState("");
  const [byCourseItems, setByCourseItems] = useState("20230001,80,90,88\n20230002,70,80,76");

  const [byStudentStudentNo, setByStudentStudentNo] = useState("");
  const [byStudentItems, setByStudentItems] = useState("C001,80,90,88\nC002,70,80,76");

  const summary = useMemo(() => {
    const c = groups.length;
    const s = groups.reduce((acc, g) => acc + (g.rows?.length ?? 0), 0);
    return { courseCount: c, rowCount: s };
  }, [groups]);

  async function load() {
    setErr(null);
    const qs = new URLSearchParams();
    if (studentNo) qs.set("student_no", studentNo);
    if (studentName) qs.set("student_name", studentName);
    if (courseNo) qs.set("course_no", courseNo);
    if (courseName) qs.set("course_name", courseName);
    if (teacherName) qs.set("teacher_name", teacherName);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<CourseGroup[]>(`/api/v1/grades?${qs.toString()}`);
    if (res.code !== 0) return setErr(res.message);
    setGroups(res.data ?? []);
  }

  function parseLines(s: string) {
    return s
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(",").map((x) => x.trim()));
  }

  async function putByCourse() {
    setErr(null);
    const items = parseLines(byCourseItems).map(([student_no, usual, exam, final]) => ({
      student_no,
      usual_score: usual ? Number(usual) : null,
      exam_score: exam ? Number(exam) : null,
      final_score: final ? Number(final) : null,
    }));
    const res = await apiFetch("/api/v1/grades/by-course", {
      method: "PUT",
      body: JSON.stringify({ course_no: byCourseCourseNo, items }),
    });
    if (res.code !== 0) return setErr(res.message);
    await load();
  }

  async function putByStudent() {
    setErr(null);
    const items = parseLines(byStudentItems).map(([course_no, usual, exam, final]) => ({
      course_no,
      usual_score: usual ? Number(usual) : null,
      exam_score: exam ? Number(exam) : null,
      final_score: final ? Number(final) : null,
    }));
    const res = await apiFetch("/api/v1/grades/by-student", {
      method: "PUT",
      body: JSON.stringify({ student_no: byStudentStudentNo, items }),
    });
    if (res.code !== 0) return setErr(res.message);
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">成绩管理（Grades）</h1>
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="查询（PRD 4.5：按条件；按课程分组；组内总评降序）">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="学号 student_no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
          <Input placeholder="学生姓名 student_name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          <Input placeholder="系号 dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
          <Input placeholder="课程号 course_no" value={courseNo} onChange={(e) => setCourseNo(e.target.value)} />
          <Input placeholder="课程名 course_name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          <Input placeholder="教师姓名 teacher_name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
          <div className="sm:col-span-3">
            <Button onClick={() => void load()}>
              查询
            </Button>
            <span className="ml-3 text-sm text-muted-foreground">
              课程 {summary.courseCount} 门 / 记录 {summary.rowCount} 条
            </span>
          </div>
        </div>
      </Section>

      <Section title="按课程批量录入/修改（teacher/admin）">
        <div className="grid gap-3">
          <Input placeholder="course_no" value={byCourseCourseNo} onChange={(e) => setByCourseCourseNo(e.target.value)} />
          <div className="text-xs text-muted-foreground">每行：student_no,usual,exam,final（逗号分隔）</div>
          <Textarea className="min-h-28 font-mono text-xs" value={byCourseItems} onChange={(e) => setByCourseItems(e.target.value)} />
          <Button onClick={() => void putByCourse()}>
            提交
          </Button>
        </div>
      </Section>

      <Section title="按学生批量录入/修改（teacher/admin）">
        <div className="grid gap-3">
          <Input placeholder="student_no" value={byStudentStudentNo} onChange={(e) => setByStudentStudentNo(e.target.value)} />
          <div className="text-xs text-muted-foreground">每行：course_no,usual,exam,final（逗号分隔）</div>
          <Textarea className="min-h-28 font-mono text-xs" value={byStudentItems} onChange={(e) => setByStudentItems(e.target.value)} />
          <Button onClick={() => void putByStudent()}>
            提交
          </Button>
        </div>
      </Section>

      <Section title="查询结果（按课程分组）">
        <div className="grid gap-6">
          {groups.map((g) => (
            <div key={g.course_no} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-semibold">
                  <span className="font-mono">{g.course_no}</span> {g.course_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  教师：<span className="font-mono">{g.teacher_no}</span> {g.teacher_name} / 学分 {g.credits}
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学号</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>平时</TableHead>
                      <TableHead>考试</TableHead>
                      <TableHead>总评</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.rows.map((r) => (
                      <TableRow key={r.student_no}>
                        <TableCell className="font-mono">{r.student_no}</TableCell>
                        <TableCell>{r.student_name}</TableCell>
                        <TableCell>{r.usual_score ?? "-"}</TableCell>
                        <TableCell>{r.exam_score ?? "-"}</TableCell>
                        <TableCell className="font-semibold">{r.final_score ?? "-"}</TableCell>
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

