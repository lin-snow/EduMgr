"use client";

import { useEffect, useState } from "react";
import { apiFetch, canWrite, type Student, type Department } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, Plus, MoreHorizontal, GraduationCap, ArrowRightLeft } from "lucide-react";

const statusLabels: Record<string, string> = {
  "在读": "在读",
  "已毕业": "已毕业",
  "已转出": "已转出",
  "转入": "转入",
};

export default function StudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [deptNo, setDeptNo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 新增/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Student | null>(null);
  const [formStudentNo, setFormStudentNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState("男");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formEntryScore, setFormEntryScore] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formStatus, setFormStatus] = useState("在读");

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Student | null>(null);

  // 毕业/转学确认对话框
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"graduate" | "transfer-out">("graduate");
  const [actionItem, setActionItem] = useState<Student | null>(null);

  // 使用 state 避免 hydration 错误
  const [writable, setWritable] = useState(false);

  async function loadDepartments() {
    const res = await apiFetch<Department[]>("/api/v1/departments");
    if (res.code === 0 && res.data) {
      setDepartments(res.data);
    }
  }

  async function load() {
    setErr(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (studentNo) qs.set("student_no", studentNo);
    if (name) qs.set("name", name);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<Student[]>(`/api/v1/students?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setFormStudentNo("");
    setFormName("");
    setFormGender("男");
    setFormBirthDate("");
    setFormEntryScore("");
    setFormDeptId(departments[0]?.id.toString() ?? "");
    setFormStatus("在读");
    setDialogOpen(true);
  }

  function openEditDialog(item: Student) {
    setEditingItem(item);
    setFormStudentNo(item.student_no);
    setFormName(item.name);
    setFormGender(item.gender);
    setFormBirthDate(item.birth_date?.split("T")[0] ?? "");
    setFormEntryScore(item.entry_score?.toString() ?? "");
    setFormDeptId(item.dept_id.toString());
    setFormStatus(item.status);
    setDialogOpen(true);
  }

  async function handleSave() {
    setErr(null);
    const payload = {
      student_no: formStudentNo,
      name: formName,
      gender: formGender,
      birth_date: formBirthDate || null,
      entry_score: formEntryScore ? Number(formEntryScore) : null,
      dept_id: Number(formDeptId),
      status: formStatus,
    };

    if (editingItem) {
      const res = await apiFetch<Student>(`/api/v1/students/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.code !== 0) {
        setErr(res.message);
        return;
      }
    } else {
      const res = await apiFetch<Student>("/api/v1/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.code !== 0) {
        setErr(res.message);
        return;
      }
    }
    setDialogOpen(false);
    await load();
  }

  function openDeleteDialog(item: Student) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/students/${deletingItem.id}`, {
      method: "DELETE",
    });
    if (res.code !== 0) {
      setErr(res.message);
      setDeleteDialogOpen(false);
      return;
    }
    setDeleteDialogOpen(false);
    await load();
  }

  function openActionDialog(item: Student, type: "graduate" | "transfer-out") {
    setActionItem(item);
    setActionType(type);
    setActionDialogOpen(true);
  }

  async function handleAction() {
    if (!actionItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/students/${actionItem.id}/${actionType}`, {
      method: "POST",
    });
    if (res.code !== 0) {
      setErr(res.message);
      setActionDialogOpen(false);
      return;
    }
    setActionDialogOpen(false);
    await load();
  }

  useEffect(() => {
    setWritable(canWrite());
    void loadDepartments();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">学生管理（Students）</h1>
        {writable && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新增
          </Button>
        )}
      </div>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <Section title="查询（PRD: 学号/姓名/系号）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="学号 student_no" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} />
          <Input placeholder="姓名 name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="系号 dept_no" value={deptNo} onChange={(e) => setDeptNo(e.target.value)} />
          <Button onClick={() => void load()} disabled={loading}>
            {loading ? "查询中..." : "查询"}
          </Button>
        </div>
      </Section>

      <Section title="列表">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>出生日期</TableHead>
                <TableHead>入学成绩</TableHead>
                <TableHead>系</TableHead>
                <TableHead>状态</TableHead>
                {writable && <TableHead className="w-16">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono">{it.student_no}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>{it.gender}</TableCell>
                  <TableCell className="text-muted-foreground">{it.birth_date?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell>{it.entry_score ?? "-"}</TableCell>
                  <TableCell>
                    <span className="font-mono">{it.dept_no}</span>
                    {it.dept_name && <span className="ml-1 text-muted-foreground">({it.dept_name})</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      it.status === "在读" ? "bg-green-100 text-green-800" :
                      it.status === "已毕业" ? "bg-blue-100 text-blue-800" :
                      it.status === "已转出" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {statusLabels[it.status] || it.status}
                    </span>
                  </TableCell>
                  {writable && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(it)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          {it.status === "在读" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openActionDialog(it, "graduate")}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                办理毕业
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openActionDialog(it, "transfer-out")}>
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                办理转学
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDeleteDialog(it)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={writable ? 8 : 7} className="text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑学生" : "新增学生"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改学生信息" : "填写新学生的基本信息"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="student_no">学号</Label>
                <Input
                  id="student_no"
                  value={formStudentNo}
                  onChange={(e) => setFormStudentNo(e.target.value)}
                  disabled={!!editingItem}
                  placeholder="如：20230001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="学生姓名"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">性别</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男">男</SelectItem>
                    <SelectItem value="女">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birth_date">出生日期</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="entry_score">入学成绩</Label>
                <Input
                  id="entry_score"
                  type="number"
                  value={formEntryScore}
                  onChange={(e) => setFormEntryScore(e.target.value)}
                  placeholder="如：650"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dept_id">所属系</Label>
                <Select value={formDeptId} onValueChange={setFormDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择系" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.dept_no} - {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingItem && (
              <div className="grid gap-2">
                <Label htmlFor="status">学籍状态</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="在读">在读</SelectItem>
                    <SelectItem value="已毕业">已毕业</SelectItem>
                    <SelectItem value="已转出">已转出</SelectItem>
                    <SelectItem value="转入">转入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生「{deletingItem?.name}」（{deletingItem?.student_no}）吗？
              <br />
              <span className="text-destructive">
                此操作不可撤销，相关的选课和成绩数据也将被删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 毕业/转学确认对话框 */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "graduate" ? "确认办理毕业" : "确认办理转学"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要为学生「{actionItem?.name}」（{actionItem?.student_no}）
              {actionType === "graduate" ? "办理毕业" : "办理转学"}吗？
              <br />
              <span className="text-muted-foreground">
                学生信息将被归档到历史库，状态将更新为
                「{actionType === "graduate" ? "已毕业" : "已转出"}」。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
