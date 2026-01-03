"use client";

import { useEffect, useState } from "react";
import { apiFetch, canWrite, type Staff, type Department } from "@/lib/api";
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
import { Pencil, Trash2, Plus } from "lucide-react";

const titleOptions = ["助教", "讲师", "副教授", "教授"];

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffNo, setStaffNo] = useState("");
  const [name, setName] = useState("");
  const [deptNo, setDeptNo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 新增/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Staff | null>(null);
  const [formStaffNo, setFormStaffNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState("男");
  const [formBirthMonth, setFormBirthMonth] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formTitle, setFormTitle] = useState("讲师");
  const [formMajor, setFormMajor] = useState("");
  const [formTeachingDirection, setFormTeachingDirection] = useState("");

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Staff | null>(null);

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
    if (staffNo) qs.set("staff_no", staffNo);
    if (name) qs.set("name", name);
    if (deptNo) qs.set("dept_no", deptNo);
    const res = await apiFetch<Staff[]>(`/api/v1/staff?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setFormStaffNo("");
    setFormName("");
    setFormGender("男");
    setFormBirthMonth("");
    setFormDeptId(departments[0]?.id.toString() ?? "");
    setFormTitle("讲师");
    setFormMajor("");
    setFormTeachingDirection("");
    setDialogOpen(true);
  }

  function openEditDialog(item: Staff) {
    setEditingItem(item);
    setFormStaffNo(item.staff_no);
    setFormName(item.name);
    setFormGender(item.gender || "男");
    setFormBirthMonth(item.birth_month || "");
    setFormDeptId(item.dept_id.toString());
    setFormTitle(item.title || "讲师");
    setFormMajor(item.major || "");
    setFormTeachingDirection(item.teaching_direction || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    setErr(null);
    const payload = {
      staff_no: formStaffNo,
      name: formName,
      gender: formGender,
      birth_month: formBirthMonth || null,
      dept_id: Number(formDeptId),
      title: formTitle,
      major: formMajor,
      teaching_direction: formTeachingDirection,
    };

    if (editingItem) {
      const res = await apiFetch<Staff>(`/api/v1/staff/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.code !== 0) {
        setErr(res.message);
        return;
      }
    } else {
      const res = await apiFetch<Staff>("/api/v1/staff", {
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

  function openDeleteDialog(item: Staff) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/staff/${deletingItem.id}`, {
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

  useEffect(() => {
    setWritable(canWrite());
    void loadDepartments();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">教职工管理（Staff）</h1>
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

      <Section title="查询（PRD: 职工号/姓名/系号）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="职工号 staff_no" value={staffNo} onChange={(e) => setStaffNo(e.target.value)} />
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
                <TableHead>职工号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>出生年月</TableHead>
                <TableHead>系</TableHead>
                <TableHead>职称</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>教学方向</TableHead>
                {writable && <TableHead className="w-24">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono">{it.staff_no}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>{it.gender || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{it.birth_month || "-"}</TableCell>
                  <TableCell>
                    <span className="font-mono">{it.dept_no}</span>
                    {it.dept_name && <span className="ml-1 text-muted-foreground">({it.dept_name})</span>}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      {it.title || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{it.major || "-"}</TableCell>
                  <TableCell className="max-w-32 truncate">{it.teaching_direction || "-"}</TableCell>
                  {writable && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(it)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(it)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={writable ? 9 : 8} className="text-center text-muted-foreground">
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
            <DialogTitle>{editingItem ? "编辑教职工" : "新增教职工"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改教职工信息" : "填写新教职工的基本信息"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff_no">职工号</Label>
                <Input
                  id="staff_no"
                  value={formStaffNo}
                  onChange={(e) => setFormStaffNo(e.target.value)}
                  disabled={!!editingItem}
                  placeholder="如：T001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="教职工姓名"
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
                <Label htmlFor="birth_month">出生年月</Label>
                <Input
                  id="birth_month"
                  type="month"
                  value={formBirthMonth}
                  onChange={(e) => setFormBirthMonth(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="title">职称</Label>
                <Select value={formTitle} onValueChange={setFormTitle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {titleOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="major">专业</Label>
              <Input
                id="major"
                value={formMajor}
                onChange={(e) => setFormMajor(e.target.value)}
                placeholder="如：计算机科学与技术"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teaching_direction">教学方向</Label>
              <Input
                id="teaching_direction"
                value={formTeachingDirection}
                onChange={(e) => setFormTeachingDirection(e.target.value)}
                placeholder="如：人工智能、数据库"
              />
            </div>
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
              确定要删除教职工「{deletingItem?.name}」（{deletingItem?.staff_no}）吗？
              <br />
              <span className="text-destructive">
                注意：如果该教职工仍承担课程，删除将会失败。
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
    </main>
  );
}
