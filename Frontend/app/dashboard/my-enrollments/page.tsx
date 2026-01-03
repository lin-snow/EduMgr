"use client";

import { useEffect, useState } from "react";
import { apiFetch, type Term, type Enrollment } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookOpen, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

type EnrollmentListResult = {
  items: Enrollment[];
  total: number;
  page: number;
  size: number;
};

export default function MyEnrollmentsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 退课确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Enrollment | null>(null);

  async function loadTerms() {
    const res = await apiFetch<Term[]>("/api/v1/terms");
    if (res.code === 0 && res.data) {
      setTerms(res.data);
      if (res.data.length > 0 && !selectedTerm) {
        setSelectedTerm(res.data[0].term_code);
      }
    }
  }

  async function loadMyEnrollments() {
    if (!selectedTerm) return;
    setLoading(true);
    setErr(null);
    // /enrollments/my returns array directly, not paginated result
    const res = await apiFetch<Enrollment[]>(`/api/v1/enrollments/my?term_code=${selectedTerm}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    // Filter by selected term (backend returns all, frontend filters)
    const filtered = (res.data ?? []).filter(e => e.term_code === selectedTerm);
    setEnrollments(filtered);
  }

  // 计算已选学分
  const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

  function openDeleteDialog(item: Enrollment) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    setSuccessMsg(null);

    const res = await apiFetch(`/api/v1/enrollments/${deletingItem.id}`, {
      method: "DELETE",
    });

    setDeleteDialogOpen(false);

    if (res.code !== 0) {
      setErr(res.message);
      return;
    }

    setSuccessMsg(`已成功退选课程「${deletingItem.course_name}」`);
    await loadMyEnrollments();
  }

  useEffect(() => {
    void loadTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      void loadMyEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm]);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">我的选课</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedTerm || "__none__"} onValueChange={(v) => setSelectedTerm(v === "__none__" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择学期" />
            </SelectTrigger>
            <SelectContent>
              {terms.length === 0 ? (
                <SelectItem value="__none__">暂无学期</SelectItem>
              ) : (
                terms.map((t) => (
                  <SelectItem key={t.id} value={t.term_code}>
                    {t.term_code} - {t.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

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

      {/* 学分统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已选课程</p>
                <p className="text-2xl font-bold">{enrollments.length} 门</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已选学分</p>
                <p className={`text-2xl font-bold ${totalCredits > 15 ? "text-destructive" : ""}`}>
                  {totalCredits}/15
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">剩余可选</p>
                <p className="text-2xl font-bold text-green-600">{Math.max(0, 15 - totalCredits)} 学分</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-medium">{Math.round((totalCredits / 15) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Section title="已选课程列表">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">加载中...</div>
        ) : enrollments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">本学期暂未选修任何课程</p>
            <Button asChild>
              <Link href="/dashboard/my-courses">去选课</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程号</TableHead>
                <TableHead>课程名称</TableHead>
                <TableHead>学分</TableHead>
                <TableHead>选课时间</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono">{e.course_no}</TableCell>
                  <TableCell>{e.course_name}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      {e.credits || 0} 学分
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.created_at?.split("T")[0] ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(e)}
                      title="退课"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* 退课确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退课</AlertDialogTitle>
            <AlertDialogDescription>
              确定要退选课程「{deletingItem?.course_name}」（{deletingItem?.course_no}）吗？
              <br />
              <span className="text-destructive">
                注意：退课将同步删除该课程的成绩记录（如有）。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认退课
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
