"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

type StaffRow = {
  id: number;
  staff_no: string;
  name: string;
  gender: string;
  birth_month: string;
  dept_id: number;
  dept_no: string;
  title: string;
  major: string;
  teaching_direction: string;
};

export default function StaffPage() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [staffNo, setStaffNo] = useState("");
  const [name, setName] = useState("");
  const [deptNo, setDeptNo] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [newStaffNo, setNewStaffNo] = useState("");
  const [newName, setNewName] = useState("");
  const [newDeptId, setNewDeptId] = useState("");

  async function load() {
    setErr(null);
    const qs = new URLSearchParams();
    if (staffNo) qs.set("staff_no", staffNo);
    if (name) qs.set("name", name);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<StaffRow[]>(`/api/v1/staff?${qs.toString()}`);
    if (res.code !== 0) return setErr(res.message);
    setItems(res.data ?? []);
  }

  async function create() {
    setErr(null);
    const dept_id = Number(newDeptId);
    const res = await apiFetch("/api/v1/staff", {
      method: "POST",
      body: JSON.stringify({ staff_no: newStaffNo, name: newName, dept_id }),
    });
    if (res.code !== 0) return setErr(res.message);
    setNewStaffNo("");
    setNewName("");
    setNewDeptId("");
    await load();
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">教职工管理（Staff）</h1>
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="查询（PRD: 职工号/姓名/系号）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="staff_no" value={staffNo} onChange={(e) => setStaffNo(e.target.value)} />
          <Input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
          <Button onClick={() => void load()}>
            查询
          </Button>
        </div>
      </Section>

      <Section title="新增（admin 才能写）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="staff_no" value={newStaffNo} onChange={(e) => setNewStaffNo(e.target.value)} />
          <Input placeholder="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
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
              <TableHead>staff_no</TableHead>
              <TableHead>name</TableHead>
              <TableHead>dept_no</TableHead>
              <TableHead>title</TableHead>
              <TableHead>major</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono">{it.staff_no}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell className="font-mono">{it.dept_no}</TableCell>
                <TableCell>{it.title}</TableCell>
                <TableCell>{it.major}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
    </main>
  );
}

