"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiBase, setToken, setUser, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Loader2 } from "lucide-react";

type LoginResp = {
  token: string;
  user: { id: number; username: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否需要初始化 & 是否已登录
  useEffect(() => {
    async function check() {
      // 如果已经有 token，尝试跳转到 dashboard
      const token = getToken();
      if (token) {
        router.replace("/dashboard");
        return;
      }

      // 检查是否需要初始化设置
      try {
        const res = await fetch(`${apiBase()}/auth/setup`);
        const json = await res.json();
        if (json.code === 0 && json.data?.setup_required) {
          // 需要初始化，跳转到设置页
          router.replace("/setup");
          return;
        }
      } catch {
        // 忽略错误，可能是后端未启动
      }
      setChecking(false);
    }
    void check();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as { code: number; message: string; data?: LoginResp };
      if (!res.ok || json.code !== 0 || !json.data?.token) {
        setError(json.message || "登录失败");
        return;
      }
      setToken(json.data.token);
      setUser(json.data.user as { id: number; username: string; role: "student" | "teacher" | "admin" });
      router.push("/dashboard");
    } catch {
      setError("网络错误，请检查后端服务是否启动");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          检查系统状态...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>EduMgr 登录</CardTitle>
          <CardDescription>请输入账号密码登录系统</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground hover:underline">
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
