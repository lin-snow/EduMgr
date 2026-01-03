"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        {err ? (
          <Alert variant="destructive">
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        <Section title="查询">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="系号 dept_no"
              value={deptNo}
              onChange={(e) => setDeptNo(e.target.value)}
            />
            <Input
              placeholder="系名称 name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={() => void load()}>
              查询
            </Button>
          </div>
        </Section>

        <Section title="新增（admin 才能写）">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="dept_no"
              value={newDeptNo}
              onChange={(e) => setNewDeptNo(e.target.value)}
            />
            <Input
              placeholder="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="intro"
              value={newIntro}
              onChange={(e) => setNewIntro(e.target.value)}
            />
            <div className="sm:col-span-3">
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
                <TableHead>dept_no</TableHead>
                <TableHead>name</TableHead>
                <TableHead>intro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono">{it.dept_no}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell className="text-muted-foreground">{it.intro}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </div>
    </main>
  );
}

