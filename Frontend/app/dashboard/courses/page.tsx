"use client";

import { useEffect, useState } from "react";
import { apiFetch, canWrite, type Course, type Staff } from "@/lib/api";
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

export default function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [courseNo, setCourseNo] = useState("");
  const [name, setName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 新增/编辑对话框
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Course | null>(null);
  const [formCourseNo, setFormCourseNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formTeacherId, setFormTeacherId] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formCredits, setFormCredits] = useState("");
  const [formClassTime, setFormClassTime] = useState("");
  const [formClassLocation, setFormClassLocation] = useState("");
  const [formExamTime, setFormExamTime] = useState("");

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Course | null>(null);

  // 使用 state 避免 hydration 错误
  const [writable, setWritable] = useState(false);

  async function loadStaff() {
    const res = await apiFetch<Staff[]>("/api/v1/staff");
    if (res.code === 0 && res.data) {
      setStaffList(res.data);
    }
  }

  async function load() {
    setErr(null);
    setLoading(true);
    const qs = new URLSearchParams();
    if (courseNo) qs.set("course_no", courseNo);
    if (name) qs.set("name", name);
    if (teacherName) qs.set("teacher_name", teacherName);
    const res = await apiFetch<Course[]>(`/api/v1/courses?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setItems(res.data ?? []);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setFormCourseNo("");
    setFormName("");
    setFormTeacherId(staffList[0]?.id.toString() ?? "");
    setFormHours("");
    setFormCredits("");
    setFormClassTime("");
    setFormClassLocation("");
    setFormExamTime("");
    setDialogOpen(true);
  }

  function openEditDialog(item: Course) {
    setEditingItem(item);
    setFormCourseNo(item.course_no);
    setFormName(item.name);
    setFormTeacherId(item.teacher_id.toString());
    setFormHours(item.hours?.toString() ?? "");
    setFormCredits(item.credits?.toString() ?? "");
    setFormClassTime(item.class_time || "");
    setFormClassLocation(item.class_location || "");
    setFormExamTime(item.exam_time || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    setErr(null);
    const payload = {
      course_no: formCourseNo,
      name: formName,
      teacher_id: Number(formTeacherId),
      hours: formHours ? Number(formHours) : null,
      credits: formCredits ? Number(formCredits) : null,
      class_time: formClassTime || null,
      class_location: formClassLocation || null,
      exam_time: formExamTime || null,
    };

    if (editingItem) {
      const res = await apiFetch<Course>(`/api/v1/courses/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (res.code !== 0) {
        setErr(res.message);
        return;
      }
    } else {
      const res = await apiFetch<Course>("/api/v1/courses", {
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

  function openDeleteDialog(item: Course) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    setErr(null);
    const res = await apiFetch(`/api/v1/courses/${deletingItem.id}`, {
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
    void loadStaff();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">课程管理（Courses）</h1>
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

      <Section title="查询（PRD: 课程号/课程名/任课教师姓名）">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="课程号 course_no" value={courseNo} onChange={(e) => setCourseNo(e.target.value)} />
          <Input placeholder="课程名 name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="教师姓名 teacher_name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
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
                <TableHead>课程号</TableHead>
                <TableHead>课程名</TableHead>
                <TableHead>任课教师</TableHead>
                <TableHead>学时</TableHead>
                <TableHead>学分</TableHead>
                <TableHead>上课时间</TableHead>
                <TableHead>上课地点</TableHead>
                <TableHead>考试时间</TableHead>
                {writable && <TableHead className="w-24">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono">{it.course_no}</TableCell>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>
                    <span className="font-mono">{it.teacher_no}</span>
                    {it.teacher_name && <span className="ml-1">({it.teacher_name})</span>}
                  </TableCell>
                  <TableCell>{it.hours ?? "-"}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      {it.credits ?? 0} 学分
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{it.class_time || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{it.class_location || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{it.exam_time || "-"}</TableCell>
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
            <DialogTitle>{editingItem ? "编辑课程" : "新增课程"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "修改课程信息" : "填写新课程的基本信息"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="course_no">课程号</Label>
                <Input
                  id="course_no"
                  value={formCourseNo}
                  onChange={(e) => setFormCourseNo(e.target.value)}
                  disabled={!!editingItem}
                  placeholder="如：C001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">课程名</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="如：数据库原理"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teacher_id">任课教师</Label>
              <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择教师" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.staff_no} - {s.name} ({s.title || "无职称"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hours">学时</Label>
                <Input
                  id="hours"
                  type="number"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  placeholder="如：48"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="credits">学分</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(e.target.value)}
                  placeholder="如：3"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="class_time">上课时间</Label>
                <Input
                  id="class_time"
                  value={formClassTime}
                  onChange={(e) => setFormClassTime(e.target.value)}
                  placeholder="如：周一 1-2节"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class_location">上课地点</Label>
                <Input
                  id="class_location"
                  value={formClassLocation}
                  onChange={(e) => setFormClassLocation(e.target.value)}
                  placeholder="如：教学楼A301"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exam_time">考试时间</Label>
              <Input
                id="exam_time"
                value={formExamTime}
                onChange={(e) => setFormExamTime(e.target.value)}
                placeholder="如：2025-01-15 09:00"
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
              确定要删除课程「{deletingItem?.name}」（{deletingItem?.course_no}）吗？
              <br />
              <span className="text-destructive">
                注意：如果有学生选修了该课程，删除可能会影响相关数据。
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
