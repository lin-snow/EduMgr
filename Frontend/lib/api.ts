// ==================== 类型定义 ====================

export type ApiResponse<T> = {
  code: number;
  message: string;
  data?: T;
};

export type UserRole = "student" | "teacher" | "admin";

export type User = {
  id: number;
  username: string;
  role: UserRole;
  student_id?: number;
  staff_id?: number;
};

export type Department = {
  id: number;
  dept_no: string;
  name: string;
  intro: string;
};

export type Student = {
  id: number;
  student_no: string;
  name: string;
  gender: string;
  birth_date: string;
  entry_score: number;
  dept_id: number;
  dept_no: string;
  dept_name: string;
  status: "在读" | "已毕业" | "已转出" | "转入";
};

export type Staff = {
  id: number;
  staff_no: string;
  name: string;
  gender: string;
  birth_month: string;
  dept_id: number;
  dept_no: string;
  dept_name: string;
  title: string;
  major: string;
  teaching_direction: string;
};

export type Course = {
  id: number;
  course_no: string;
  name: string;
  teacher_id: number;
  teacher_no: string;
  teacher_name: string;
  hours: number;
  credits: number;
  class_time: string;
  class_location: string;
  exam_time: string;
};

export type Term = {
  id: number;
  term_code: string;
  name: string;
  start_date?: string;
  end_date?: string;
};

export type Enrollment = {
  id: number;
  student_id: number;
  student_no: string;
  student_name: string;
  course_id: number;
  course_no: string;
  course_name: string;
  term_id: number;
  term_code: string;
  credits: number;
  created_at: string;
};

export type GradeRow = {
  student_no: string;
  student_name: string;
  gender: string;
  usual_score?: number | null;
  exam_score?: number | null;
  final_score?: number | null;
};

export type CourseGradeGroup = {
  course_no: string;
  course_name: string;
  teacher_no: string;
  teacher_name: string;
  hours: number;
  credits: number;
  class_time: string;
  class_location: string;
  exam_time: string;
  dept_no: string;
  rows: GradeRow[];
};

// ==================== Token 管理 ====================

export function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("edumgr_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("edumgr_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("edumgr_token");
  localStorage.removeItem("edumgr_user");
}

// ==================== 用户状态管理 ====================

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const json = localStorage.getItem("edumgr_user");
  if (!json) return null;
  try {
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem("edumgr_user", JSON.stringify(user));
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === "admin";
}

export function isTeacher(): boolean {
  const user = getUser();
  return user?.role === "teacher";
}

export function isStudent(): boolean {
  const user = getUser();
  return user?.role === "student";
}

export function canWrite(): boolean {
  const user = getUser();
  return user?.role === "admin";
}

export function canGrade(): boolean {
  const user = getUser();
  return user?.role === "admin" || user?.role === "teacher";
}

// ==================== API 请求 ====================

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.get("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = { code: res.ok ? 0 : res.status, message: "invalid response" };
  }
  if (res.status === 401) clearToken();
  return json;
}

// ==================== 便捷 API 方法 ====================

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch<{ user: User }>("/auth/me");
  if (res.code === 0 && res.data?.user) {
    setUser(res.data.user);
    return res.data.user;
  }
  return null;
}
