"use client";

import { useEffect, useState } from "react";
import { apiFetch, type Course, type Term, type Enrollment } from "@/lib/api";
import { Section } from "../_components/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Clock, MapPin, User, Award, CheckCircle2, Plus } from "lucide-react";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 筛选
  const [filterCourseName, setFilterCourseName] = useState("");
  const [filterTeacherName, setFilterTeacherName] = useState("");

  // 选课确认对话框
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);

  async function loadTerms() {
    const res = await apiFetch<Term[]>("/api/v1/terms");
    if (res.code === 0 && res.data) {
      setTerms(res.data);
      // 默认选择最新的学期
      if (res.data.length > 0 && !selectedTerm) {
        setSelectedTerm(res.data[0].term_code);
      }
    }
  }

  async function loadCourses() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filterCourseName) qs.set("name", filterCourseName);
    if (filterTeacherName) qs.set("teacher_name", filterTeacherName);
    const res = await apiFetch<Course[]>(`/api/v1/courses?${qs.toString()}`);
    setLoading(false);
    if (res.code !== 0) {
      setErr(res.message);
      return;
    }
    setCourses(res.data ?? []);
  }

  async function loadMyEnrollments() {
    if (!selectedTerm) return;
    // /enrollments/my returns array directly, not paginated result
    const res = await apiFetch<Enrollment[]>("/api/v1/enrollments/my");
    if (res.code === 0) {
      setMyEnrollments(res.data ?? []);
    }
  }

  // 当前学期的选课（用于计算学分）
  const currentTermEnrollments = myEnrollments.filter(e => e.term_code === selectedTerm);
  // 计算当前学期已选学分
  const totalCredits = currentTermEnrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

  // 检查课程是否已选（任意学期）
  const isEnrolled = (courseNo: string) => {
    return myEnrollments.some((e) => e.course_no === courseNo);
  };

  // 获取课程的选课学期（如果已选）
  const getEnrolledTerm = (courseNo: string) => {
    const enrollment = myEnrollments.find((e) => e.course_no === courseNo);
    return enrollment?.term_code;
  };

  function openEnrollDialog(course: Course) {
    if (!selectedTerm) {
      setErr("请先选择学期");
      return;
    }
    setEnrollingCourse(course);
    setEnrollDialogOpen(true);
  }

  async function handleEnroll() {
    if (!enrollingCourse || !selectedTerm) return;
    setErr(null);
    setSuccessMsg(null);

    const res = await apiFetch("/api/v1/enrollments", {
      method: "POST",
      body: JSON.stringify({
        term_code: selectedTerm,
        course_nos: [enrollingCourse.course_no],
      }),
    });

    setEnrollDialogOpen(false);

    if (res.code !== 0) {
      setErr(res.message);
      return;
    }

    setSuccessMsg(`成功选修课程「${enrollingCourse.name}」！`);
    await loadMyEnrollments();
  }

  useEffect(() => {
    void loadTerms();
    void loadCourses();
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
        <h1 className="text-2xl font-semibold">课程选课</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            当前学期已选：
            <span className={`ml-1 font-medium ${totalCredits > 15 ? "text-destructive" : "text-green-600"}`}>
              {totalCredits}/15 学分
            </span>
          </div>
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

      <Section title="筛选课程">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="课程名称"
            value={filterCourseName}
            onChange={(e) => setFilterCourseName(e.target.value)}
          />
          <Input
            placeholder="任课教师"
            value={filterTeacherName}
            onChange={(e) => setFilterTeacherName(e.target.value)}
          />
          <Button onClick={() => void loadCourses()} disabled={loading}>
            {loading ? "查询中..." : "查询"}
          </Button>
        </div>
      </Section>

      <Section title="可选课程列表" description="点击「选课」按钮即可选修课程">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.course_no);
            const wouldExceedCredits = totalCredits + (course.credits || 0) > 15;

            return (
              <Card key={course.id} className={enrolled ? "border-green-500 bg-green-50/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{course.name}</CardTitle>
                      <CardDescription className="font-mono">{course.course_no}</CardDescription>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {course.credits || 0} 学分
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{course.teacher_name || "未指定教师"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.class_time || "时间待定"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{course.class_location || "地点待定"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{course.hours || 0} 学时</span>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    {enrolled ? (
                      <Button variant="outline" disabled className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                        已选修{getEnrolledTerm(course.course_no) !== selectedTerm && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({getEnrolledTerm(course.course_no)})
                          </span>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openEnrollDialog(course)}
                        disabled={!selectedTerm || wouldExceedCredits}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {wouldExceedCredits ? "学分超限" : "选课"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {courses.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              暂无可选课程
            </div>
          )}
        </div>
      </Section>

      {/* 选课确认对话框 */}
      <AlertDialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认选课</AlertDialogTitle>
            <AlertDialogDescription>
              确定要选修课程「{enrollingCourse?.name}」（{enrollingCourse?.course_no}）吗？
              <br />
              <span className="text-muted-foreground">
                选课后将占用 {enrollingCourse?.credits || 0} 学分，
                当前已选 {totalCredits} 学分，选课后将达到 {totalCredits + (enrollingCourse?.credits || 0)}/15 学分。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnroll}>确认选课</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
