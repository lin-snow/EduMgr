"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CourseRow = {
  id: number;
  course_no: string;
  name: string;
  teacher_id: number;
  teacher_no: string;
  teacher_name: string;
  hours: number;
  credits: number;
  class_time: string;
  class_location: string;
  exam_time: string;
};

export default function CoursesPage() {
  const [items, setItems] = useState<CourseRow[]>([]);
  const [courseNo, setCourseNo] = useState("");
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [newCourseNo, setNewCourseNo] = useState("");
  const [newName, setNewName] = useState("");
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newCredits, setNewCredits] = useState("0");

  async function load() {
    setErr(null);
    const qs = new URLSearchParams();
    if (courseNo) qs.set("course_no", courseNo);
    if (name) qs.set("name", name);
    if (teacherName) qs.set("teacher_name", teacherName);
    const res = await apiFetch<CourseRow[]>(`/api/v1/courses?${qs.toString()}`);
    if (res.code !== 0) return setErr(res.message);
    setItems(res.data ?? []);
  }

  async function create() {
    setErr(null);
    const teacher_id = Number(newTeacherId);
    const credits = Number(newCredits);
    const res = await apiFetch("/api/v1/courses", {
      method: "POST",
      body: JSON.stringify({
        course_no: newCourseNo,
        name: newName,
        teacher_id,
        credits,
      }),
    });
    if (res.code !== 0) return setErr(res.message);
    setNewCourseNo("");
    setNewName("");
    setNewTeacherId("");
    setNewCredits("0");
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">课程管理（Courses）</h1>
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="查询（PRD: 课程号/课程名/任课教师姓名）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="course_no" value={courseNo} onChange={(e) => setCourseNo(e.target.value)} />
          <Input placeholder="course_name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="teacher_name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
          <Button onClick={() => void load()}>
            查询
          </Button>
        </div>
      </Section>

      <Section title="新增（admin 才能写）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="course_no" value={newCourseNo} onChange={(e) => setNewCourseNo(e.target.value)} />
          <Input placeholder="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="teacher_id（数字）" value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value)} />
          <Input placeholder="credits" value={newCredits} onChange={(e) => setNewCredits(e.target.value)} />
          <div className="sm:col-span-4">
            <Button onClick={() => void create()}>
              新增
            </Button>
          </div>
        </div>
      </Section>

      <Section title="列表">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>course_no</TableHead>
              <TableHead>name</TableHead>
              <TableHead>teacher</TableHead>
              <TableHead>credits</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono">{it.course_no}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>
                  <span className="font-mono">{it.teacher_no}</span> {it.teacher_name}
                </TableCell>
                <TableCell>{it.credits}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </main>
  );
}

