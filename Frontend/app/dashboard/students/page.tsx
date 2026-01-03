"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type StudentRow = {
  id: number;
  student_no: string;
  name: string;
  gender: string;
  dept_id: number;
  dept_no: string;
  status: string;
};

export default function StudentsPage() {
  const [items, setItems] = useState<StudentRow[]>([]);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [deptNo, setDeptNo] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [newStudentNo, setNewStudentNo] = useState("");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newDeptId, setNewDeptId] = useState("");

  async function load() {
    setErr(null);
    const qs = new URLSearchParams();
    if (studentNo) qs.set("student_no", studentNo);
    if (name) qs.set("name", name);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<StudentRow[]>(`/api/v1/students?${qs.toString()}`);
    if (res.code !== 0) return setErr(res.message);
    setItems(res.data ?? []);
  }

  async function create() {
    setErr(null);
    const dept_id = Number(newDeptId);
    const res = await apiFetch("/api/v1/students", {
      method: "POST",
      body: JSON.stringify({
        student_no: newStudentNo,
        name: newName,
        gender: newGender,
        dept_id,
      }),
    });
    if (res.code !== 0) return setErr(res.message);
    setNewStudentNo("");
    setNewName("");
    setNewGender("");
    setNewDeptId("");
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <h1 className="text-2xl font-semibold">学生管理（Students）</h1>
        {err ? (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        <Section title="查询（PRD: 学号/姓名/系号）">
          <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="学号 student_no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
          <Input placeholder="姓名 name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="系号 dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
          <Button onClick={() => void load()}>
              查询
          </Button>
          </div>
        </Section>

        <Section title="新增（admin 才能写）">
          <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="student_no" value={newStudentNo} onChange={(e) => setNewStudentNo(e.target.value)} />
          <Input placeholder="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="gender" value={newGender} onChange={(e) => setNewGender(e.target.value)} />
          <Input placeholder="dept_id（数字）" value={newDeptId} onChange={(e) => setNewDeptId(e.target.value)} />
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
              <TableHead>student_no</TableHead>
              <TableHead>name</TableHead>
              <TableHead>gender</TableHead>
              <TableHead>dept_no</TableHead>
              <TableHead>status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono">{it.student_no}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.gender}</TableCell>
                <TableCell className="font-mono">{it.dept_no}</TableCell>
                <TableCell>{it.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Section>
      </div>
    </main>
  );
}

