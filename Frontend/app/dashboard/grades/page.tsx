"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, canGrade, type CourseGradeGroup } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileEdit, BookOpen, User } from "lucide-react";

export default function GradesPage() {
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [groups, setGroups] = useState<CourseGradeGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // 查询条件
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseNo, setCourseNo] = useState("");
  const [courseName, setCourseName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [deptNo, setDeptNo] = useState("");

  // 按课程录入
  const [byCourseCourseNo, setByCourseCourseNo] = useState("");
  const [byCourseItems, setByCourseItems] = useState("20230001,80,90,88\n20230002,70,80,76");

  // 按学生录入
  const [byStudentStudentNo, setByStudentStudentNo] = useState("");
  const [byStudentItems, setByStudentItems] = useState("C001,80,90,88\nC002,70,80,76");

  // 使用 state 避免 hydration 错误
  const [gradeEditable, setGradeEditable] = useState(false);

  const summary = useMemo(() => {
    const c = groups.length;
    const s = groups.reduce((acc, g) => acc + (g.rows?.length ?? 0), 0);
    return { courseCount: c, rowCount: s };
  }, [groups]);

  async function load() {
    setErr(null);
    setSuccessMsg(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (studentNo) qs.set("student_no", studentNo);
    if (studentName) qs.set("student_name", studentName);
    if (courseNo) qs.set("course_no", courseNo);
    if (courseName) qs.set("course_name", courseName);
    if (teacherName) qs.set("teacher_name", teacherName);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<CourseGradeGroup[]>(`/api/v1/grades?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
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
    setSuccessMsg(null);
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
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setSuccessMsg(`成功录入/更新 ${items.length} 条成绩！`);
    await load();
  }

  async function putByStudent() {
    setErr(null);
    setSuccessMsg(null);
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
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setSuccessMsg(`成功录入/更新 ${items.length} 条成绩！`);
    await load();
  }

  useEffect(() => {
    setGradeEditable(canGrade());
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">成绩管理（Grades）</h1>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert>
          <AlertDescription className="text-green-600">{successMsg}</AlertDescription>
        </Alert>
      )}

      <Section title="查询（PRD 4.5：按条件；按课程分组；组内总评降序）">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="学号 student_no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
            <Input placeholder="学生姓名 student_name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            <Input placeholder="系号 dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
            <Input placeholder="课程号 course_no" value={courseNo} onChange={(e) => setCourseNo(e.target.value)} />
            <Input placeholder="课程名 course_name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
            <Input placeholder="教师姓名 teacher_name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => void load()} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "查询中..." : "查询"}
            </Button>
            <span className="text-sm text-muted-foreground">
              共 {summary.courseCount} 门课程 / {summary.rowCount} 条成绩记录
            </span>
          </div>
        </div>
      </Section>

      {gradeEditable && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                按课程批量录入/修改
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="by_course_no">课程号</Label>
                <Input
                  id="by_course_no"
                  placeholder="如：C001"
                  value={byCourseCourseNo}
                  onChange={(e) => setByCourseCourseNo(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>成绩数据</Label>
                <div className="text-xs text-muted-foreground">
                  每行格式：学号,平时成绩,考试成绩,总评成绩
                </div>
                <Textarea
                  className="min-h-28 font-mono text-xs"
                  value={byCourseItems}
                  onChange={(e) => setByCourseItems(e.target.value)}
                  placeholder="20230001,80,90,88&#10;20230002,70,80,76"
                />
              </div>
              <Button onClick={() => void putByCourse()}>
                <FileEdit className="mr-2 h-4 w-4" />
                提交
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                按学生批量录入/修改
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="by_student_no">学号</Label>
                <Input
                  id="by_student_no"
                  placeholder="如：20230001"
                  value={byStudentStudentNo}
                  onChange={(e) => setByStudentStudentNo(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>成绩数据</Label>
                <div className="text-xs text-muted-foreground">
                  每行格式：课程号,平时成绩,考试成绩,总评成绩
                </div>
                <Textarea
                  className="min-h-28 font-mono text-xs"
                  value={byStudentItems}
                  onChange={(e) => setByStudentItems(e.target.value)}
                  placeholder="C001,80,90,88&#10;C002,70,80,76"
                />
              </div>
              <Button onClick={() => void putByStudent()}>
                <FileEdit className="mr-2 h-4 w-4" />
                提交
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Section title="查询结果（按课程分组，组内按总评降序）">
        <div className="grid gap-6">
          {groups.map((g) => (
            <div key={g.course_no} className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-mono text-lg font-semibold">{g.course_no}</span>
                    <span className="ml-2 text-lg">{g.course_name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                      教师：{g.teacher_no} {g.teacher_name}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">
                      {g.credits} 学分
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-800">
                      {g.hours} 学时
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  上课：{g.class_time || "-"} @ {g.class_location || "-"}
                  {g.exam_time && <span className="ml-4">考试：{g.exam_time}</span>}
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学号</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>性别</TableHead>
                      <TableHead className="text-right">平时成绩</TableHead>
                      <TableHead className="text-right">考试成绩</TableHead>
                      <TableHead className="text-right">总评成绩</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.rows.map((r) => (
                      <TableRow key={r.student_no}>
                        <TableCell className="font-mono">{r.student_no}</TableCell>
                        <TableCell>{r.student_name}</TableCell>
                        <TableCell>{r.gender}</TableCell>
                        <TableCell className="text-right">{r.usual_score ?? "-"}</TableCell>
                        <TableCell className="text-right">{r.exam_score ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            (r.final_score ?? 0) >= 90 ? "text-green-600" :
                            (r.final_score ?? 0) >= 60 ? "text-foreground" :
                            r.final_score != null ? "text-destructive" : ""
                          }`}>
                            {r.final_score ?? "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {g.rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          暂无成绩记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              暂无成绩数据，请调整查询条件
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}
