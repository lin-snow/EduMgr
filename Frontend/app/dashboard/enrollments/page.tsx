"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Term = { id: number; term_code: string; name: string };
type EnrollResult = { student_id: number; term_id: number; course_ids: number[] };

export default function EnrollmentsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [termCode, setTermCode] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentNos, setStudentNos] = useState("");
  const [courseNos, setCourseNos] = useState("");
  const [result, setResult] = useState<EnrollResult[] | null>(null);

  const [newTermCode, setNewTermCode] = useState("");
  const [newTermName, setNewTermName] = useState("");

  async function loadTerms() {
    const res = await apiFetch<Term[]>("/api/v1/terms");
    if (res.code !== 0) return setErr(res.message);
    setTerms(res.data ?? []);
  }

  async function createTerm() {
    setErr(null);
    const res = await apiFetch("/api/v1/terms", {
      method: "POST",
      body: JSON.stringify({ term_code: newTermCode, name: newTermName }),
    });
    if (res.code !== 0) return setErr(res.message);
    setNewTermCode("");
    setNewTermName("");
    await loadTerms();
  }

  async function enroll() {
    setErr(null);
    setResult(null);
    const parseCSV = (s: string) =>
      s
        .split(/[,\n]/)
        .map((x) => x.trim())
        .filter(Boolean);
    const payload: { term_code: string; course_nos: string[]; student_no?: string; student_nos?: string[] } = {
      term_code: termCode,
      course_nos: parseCSV(courseNos),
    };
    if (studentNos.trim()) payload.student_nos = parseCSV(studentNos);
    else payload.student_no = studentNo;

    const res = await apiFetch<EnrollResult[]>("/api/v1/enrollments", { method: "POST", body: JSON.stringify(payload) });
    if (res.code !== 0) return setErr(res.message);
    setResult(res.data ?? null);
  }

  useEffect(() => {
    // eslint rule in this repo forbids direct setState calls via helper inside the effect body.
    // Schedule to avoid synchronous setState in effect.
    const t = setTimeout(() => void loadTerms(), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">选课管理（Enrollments）</h1>
      {err ? (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="学期（Terms）">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="term_code (如 2025-FALL)" value={newTermCode} onChange={(e) => setNewTermCode(e.target.value)} />
          <Input placeholder="name" value={newTermName} onChange={(e) => setNewTermName(e.target.value)} />
          <Button onClick={() => void createTerm()}>
            新增学期
          </Button>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          已有学期：{terms.map((t) => `${t.term_code}(${t.name})`).join(" / ") || "（暂无）"}
        </div>
      </Section>

      <Section title="选课（PRD: 每学期总学分 ≤ 15；支持单人多课/多人多课）">
        <div className="grid gap-3">
          <Input placeholder="term_code" value={termCode} onChange={(e) => setTermCode(e.target.value)} />
          <Input placeholder="单个学生：student_no（与下面 student_nos 二选一）" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
          <Textarea placeholder="多个学生：student_nos（逗号或换行分隔）" value={studentNos} onChange={(e) => setStudentNos(e.target.value)} />
          <Textarea placeholder="course_nos（逗号或换行分隔）" value={courseNos} onChange={(e) => setCourseNos(e.target.value)} />
          <Button onClick={() => void enroll()}>
            提交选课
          </Button>
          {result ? (
            <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs">
{JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </div>
      </Section>

      <Section title="退课说明">
        <div className="text-sm text-muted-foreground">
          后端目前提供按 enrollment_id 删除：<code className="font-mono">DELETE /api/v1/enrollments/:id</code>（同事务删除成绩）。\n
          如果你需要前端“列表并一键退课”，需要后端补一个 enrollments 查询接口（我可以配合对接）。
        </div>
      </Section>
    </main>
  );
}

