"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase, setToken, setUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, ShieldCheck, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否需要初始化
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch(`${apiBase()}/auth/setup`);
        const json = await res.json();
        if (json.code === 0 && json.data?.setup_required) {
          setSetupRequired(true);
        } else {
          // 已经初始化过，跳转到登录页
          router.replace("/login");
        }
      } catch {
        setError("无法连接到服务器");
      } finally {
        setChecking(false);
      }
    }
    void checkSetup();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 验证
    if (!username.trim()) {
      setError("请输入用户名");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少6位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      
      if (!res.ok || json.code !== 0) {
        setError(json.message || "创建管理员失败");
        return;
      }

      // 创建成功后自动登录
      const loginRes = await fetch(`${apiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const loginJson = await loginRes.json();
      
      if (loginRes.ok && loginJson.code === 0 && loginJson.data?.token) {
        setToken(loginJson.data.token);
        setUser(loginJson.data.user);
        router.push("/dashboard");
      } else {
        // 创建成功但登录失败，跳转到登录页
        router.push("/login");
      }
    } catch {
      setError("网络错误");
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

  if (!setupRequired) {
    return null; // 会自动跳转
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">EduMgr 初始化设置</CardTitle>
          <CardDescription>
            首次使用系统，请创建管理员账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">管理员账号</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                此账号将拥有系统最高权限，请妥善保管账号密码
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理员用户名"
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
                placeholder="请输入密码（至少6位）"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
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
                  创建中...
                </>
              ) : (
                "创建管理员账号"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
