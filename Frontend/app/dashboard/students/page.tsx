"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";

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
        {err ? <div className="text-sm text-destructive">{err}</div> : null}

        <Section title="查询（PRD: 学号/姓名/系号）">
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="学号 student_no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="姓名 name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="系号 dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
            <button className="h-10 rounded-md bg-primary text-primary-foreground" onClick={() => void load()}>
              查询
            </button>
          </div>
        </Section>

        <Section title="新增（admin 才能写）">
          <div className="grid gap-3 sm:grid-cols-4">
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="student_no" value={newStudentNo} onChange={(e) => setNewStudentNo(e.target.value)} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="gender" value={newGender} onChange={(e) => setNewGender(e.target.value)} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="dept_id（数字）" value={newDeptId} onChange={(e) => setNewDeptId(e.target.value)} />
            <div className="sm:col-span-4">
              <button className="h-10 rounded-md bg-primary px-4 text-primary-foreground" onClick={() => void create()}>
                新增
              </button>
            </div>
          </div>
        </Section>

        <Section title="列表">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">student_no</th>
                  <th>name</th>
                  <th>gender</th>
                  <th>dept_no</th>
                  <th>status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="py-2 font-mono">{it.student_no}</td>
                    <td>{it.name}</td>
                    <td>{it.gender}</td>
                    <td className="font-mono">{it.dept_no}</td>
                    <td>{it.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </main>
  );
}

