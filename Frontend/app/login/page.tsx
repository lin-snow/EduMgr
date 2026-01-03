"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiBase, setToken } from "@/lib/api";

type LoginResp = {
  token: string;
  user: { id: number; username: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/dashboard");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">EduMgr 登录</h1>
        <p className="mt-1 text-sm text-muted-foreground">请输入账号密码获取 JWT。</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm">用户名</span>
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm">密码</span>
            <input
              className="h-10 rounded-md border border-input bg-background px-3"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          <button
            className="h-10 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </main>
  );
}

