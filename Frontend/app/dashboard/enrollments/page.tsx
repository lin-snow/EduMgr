"use client";

import { useEffect, useState } from "react";
import { apiFetch, canWrite, type Term, type Enrollment } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Calendar } from "lucide-react";

type EnrollResult = { student_id: number; term_id: number; course_ids: number[] };

export default function EnrollmentsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 查询筛选
  const [filterTermCode, setFilterTermCode] = useState("");
  const [filterStudentNo, setFilterStudentNo] = useState("");
  const [filterCourseNo, setFilterCourseNo] = useState("");

  // 选课表单
  const [termCode, setTermCode] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentNos, setStudentNos] = useState("");
  const [courseNos, setCourseNos] = useState("");
  const [result, setResult] = useState<EnrollResult[] | null>(null);

  // 新增学期对话框
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [newTermCode, setNewTermCode] = useState("");
  const [newTermName, setNewTermName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Enrollment | null>(null);

  async function loadTerms() {
    const res = await apiFetch<Term[]>("/api/v1/terms");
    if (res.code === 0 && res.data) {
      setTerms(res.data);
    }
  }

  // 分页响应类型
  type EnrollmentListResult = {
    items: Enrollment[];
    total: number;
    page: number;
    size: number;
  };

  async function loadEnrollments() {
    setErr(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (filterTermCode) qs.set("term_code", filterTermCode);
    if (filterStudentNo) qs.set("student_no", filterStudentNo);
    if (filterCourseNo) qs.set("course_no", filterCourseNo);
    const res = await apiFetch<EnrollmentListResult>(`/api/v1/enrollments?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    // 后端返回 { items: [], total, page, size } 分页格式
    setEnrollments(res.data?.items ?? []);
  }

  async function createTerm() {
    setErr(null);
    const payload: Record<string, string | null> = {
      term_code: newTermCode,
      name: newTermName,
    };
    if (newStartDate) payload.start_date = newStartDate;
    if (newEndDate) payload.end_date = newEndDate;

    const res = await apiFetch<Term>("/api/v1/terms", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setTermDialogOpen(false);
    setNewTermCode("");
    setNewTermName("");
    setNewStartDate("");
    setNewEndDate("");
    await loadTerms();
  }

  async function enroll() {
    setErr(null);
    setSuccessMsg(null);
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
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setResult(res.data ?? null);
    setSuccessMsg("选课成功！");
    // 刷新选课列表
    await loadEnrollments();
  }

  function openDeleteDialog(item: Enrollment) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/enrollments/${deletingItem.id}`, {
      method: "DELETE",
    });
    if (res.code !== 0) {
      setErr(res.message);
      setDeleteDialogOpen(false);
      return;
    }
    setDeleteDialogOpen(false);
    setSuccessMsg("退课成功！相关成绩已同步删除。");
    await loadEnrollments();
  }

  useEffect(() => {
    void loadTerms();
    void loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writable = canWrite();

  // 计算学生在当前学期的总学分
  const studentCredits = (studentNo: string, termCode: string) => {
    return enrollments
      .filter((e) => e.student_no === studentNo && e.term_code === termCode)
      .reduce((sum, e) => sum + (e.credits || 0), 0);
  };

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">选课管理（Enrollments）</h1>
        {writable && (
          <Button onClick={() => setTermDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            新增学期
          </Button>
        )}
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

      <Section title="学期（Terms）">
        <div className="flex flex-wrap gap-2">
          {terms.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
              <span className="font-mono font-medium">{t.term_code}</span>
              <span className="ml-2 text-muted-foreground">{t.name}</span>
              {t.start_date && t.end_date && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({t.start_date?.split("T")[0]} ~ {t.end_date?.split("T")[0]})
                </span>
              )}
            </div>
          ))}
          {terms.length === 0 && (
            <div className="text-sm text-muted-foreground">暂无学期，请先创建学期</div>
          )}
        </div>
      </Section>

      {writable && (
        <Section title="选课（PRD: 每学期总学分 ≤ 15；支持单人多课/多人多课）">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>学期</Label>
              {terms.length > 0 ? (
                <Select value={termCode || undefined} onValueChange={setTermCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学期" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={t.term_code}>
                        {t.term_code} - {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  请先创建学期
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>单个学生（与下方多个学生二选一）</Label>
              <Input
                placeholder="学号 student_no"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>多个学生（逗号或换行分隔）</Label>
              <Textarea
                placeholder="学号列表，如：20230001,20230002"
                value={studentNos}
                onChange={(e) => setStudentNos(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>课程号（逗号或换行分隔）</Label>
              <Textarea
                placeholder="课程号列表，如：C001,C002"
                value={courseNos}
                onChange={(e) => setCourseNos(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void enroll()}>
                <Plus className="mr-2 h-4 w-4" />
                提交选课
              </Button>
            </div>
            {result && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="mb-2 text-sm font-medium">选课结果：</div>
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="选课记录查询">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Select 
              value={filterTermCode || "__all__"} 
              onValueChange={(v) => setFilterTermCode(v === "__all__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="筛选学期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部学期</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.term_code}>
                    {t.term_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="学号 student_no"
              value={filterStudentNo}
              onChange={(e) => setFilterStudentNo(e.target.value)}
            />
            <Input
              placeholder="课程号 course_no"
              value={filterCourseNo}
              onChange={(e) => setFilterCourseNo(e.target.value)}
            />
            <Button onClick={() => void loadEnrollments()} disabled={loading}>
              {loading ? "查询中..." : "查询"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学期</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>课程号</TableHead>
                  <TableHead>课程名</TableHead>
                  <TableHead>学分</TableHead>
                  <TableHead>选课时间</TableHead>
                  {writable && <TableHead className="w-16">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.term_code}</TableCell>
                    <TableCell className="font-mono">{e.student_no}</TableCell>
                    <TableCell>{e.student_name}</TableCell>
                    <TableCell className="font-mono">{e.course_no}</TableCell>
                    <TableCell>{e.course_name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        {e.credits || 0}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        (本学期已选: {studentCredits(e.student_no, e.term_code)}/15)
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.created_at?.split("T")[0] ?? "-"}
                    </TableCell>
                    {writable && (
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
                    )}
                  </TableRow>
                ))}
                {enrollments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={writable ? 8 : 7} className="text-center text-muted-foreground">
                      暂无选课记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Section>

      {/* 新增学期对话框 */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增学期</DialogTitle>
            <DialogDescription>创建新的学期用于选课管理</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="term_code">学期代码</Label>
                <Input
                  id="term_code"
                  value={newTermCode}
                  onChange={(e) => setNewTermCode(e.target.value)}
                  placeholder="如：2025-SPRING"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="term_name">学期名称</Label>
                <Input
                  id="term_name"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  placeholder="如：2025年春季学期"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">开始日期（可选）</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_date">结束日期（可选）</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTermDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={createTerm}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退课确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退课</AlertDialogTitle>
            <AlertDialogDescription>
              确定要为学生「{deletingItem?.student_name}」（{deletingItem?.student_no}）
              退选课程「{deletingItem?.course_name}」（{deletingItem?.course_no}）吗？
              <br />
              <span className="text-destructive">
                注意：退课将同步删除该学生该课程的成绩记录。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认退课
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
