"use client";

import { useEffect, useState } from "react";
import { apiFetch, canWrite, type Department } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [deptNo, setDeptNo] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 新增/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);
  const [formDeptNo, setFormDeptNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formIntro, setFormIntro] = useState("");

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Department | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (deptNo) qs.set("dept_no", deptNo);
    if (name) qs.set("name", name);
    const res = await apiFetch<Department[]>(`/api/v1/departments?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setFormDeptNo("");
    setFormName("");
    setFormIntro("");
    setDialogOpen(true);
  }

  function openEditDialog(item: Department) {
    setEditingItem(item);
    setFormDeptNo(item.dept_no);
    setFormName(item.name);
    setFormIntro(item.intro);
    setDialogOpen(true);
  }

  async function handleSave() {
    setErr(null);
    const payload = { dept_no: formDeptNo, name: formName, intro: formIntro };

    if (editingItem) {
      // 更新
      const res = await apiFetch<Department>(`/api/v1/departments/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.code !== 0) {
        setErr(res.message);
        return;
      }
    } else {
      // 新增
      const res = await apiFetch<Department>("/api/v1/departments", {
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

  function openDeleteDialog(item: Department) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/departments/${deletingItem.id}`, {
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const writable = canWrite();

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">系管理（Departments）</h1>
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
          <Button onClick={() => void load()} disabled={loading}>
            {loading ? "查询中..." : "查询"}
          </Button>
        </div>
      </Section>

      <Section title="列表">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>系号</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>简介</TableHead>
              {writable && <TableHead className="w-24">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono">{it.dept_no}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{it.intro}</TableCell>
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
                <TableCell colSpan={writable ? 4 : 3} className="text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Section>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑系" : "新增系"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改系信息" : "填写新系的基本信息"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dept_no">系号</Label>
              <Input
                id="dept_no"
                value={formDeptNo}
                onChange={(e) => setFormDeptNo(e.target.value)}
                disabled={!!editingItem}
                placeholder="如：D001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如：计算机科学与技术系"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="intro">简介</Label>
              <Textarea
                id="intro"
                value={formIntro}
                onChange={(e) => setFormIntro(e.target.value)}
                placeholder="系的简要介绍..."
                rows={3}
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
              确定要删除系「{deletingItem?.name}」（{deletingItem?.dept_no}）吗？
              <br />
              <span className="text-destructive">
                注意：如果该系下有学生、教师或课程，删除将会失败。
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
