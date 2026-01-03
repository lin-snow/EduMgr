"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";

type Department = {
  id: number;
  dept_no: string;
  name: string;
  intro: string;
};

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [deptNo, setDeptNo] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [newDeptNo, setNewDeptNo] = useState("");
  const [newName, setNewName] = useState("");
  const [newIntro, setNewIntro] = useState("");

  async function load() {
    setErr(null);
    const qs = new URLSearchParams();
    if (deptNo) qs.set("dept_no", deptNo);
    if (name) qs.set("name", name);
    const res = await apiFetch<Department[]>(`/api/v1/departments?${qs.toString()}`);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  async function create() {
    setErr(null);
    const res = await apiFetch<Department>("/api/v1/departments", {
      method: "POST",
      body: JSON.stringify({ dept_no: newDeptNo, name: newName, intro: newIntro }),
    });
    if (res.code !== 0) return setErr(res.message);
    setNewDeptNo("");
    setNewName("");
    setNewIntro("");
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <h1 className="text-2xl font-semibold">系管理（Departments）</h1>
        {err ? <div className="text-sm text-destructive">{err}</div> : null}

        <Section title="查询">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="系号 dept_no"
              value={deptNo}
              onChange={(e) => setDeptNo(e.target.value)}
            />
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="系名称 name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="h-10 rounded-md bg-primary text-primary-foreground" onClick={() => void load()}>
              查询
            </button>
          </div>
        </Section>

        <Section title="新增（admin 才能写）">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="dept_no"
              value={newDeptNo}
              onChange={(e) => setNewDeptNo(e.target.value)}
            />
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              placeholder="intro"
              value={newIntro}
              onChange={(e) => setNewIntro(e.target.value)}
            />
            <div className="sm:col-span-3">
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
                  <th className="py-2">dept_no</th>
                  <th>name</th>
                  <th>intro</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="py-2 font-mono">{it.dept_no}</td>
                    <td>{it.name}</td>
                    <td className="text-muted-foreground">{it.intro}</td>
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

