"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getToken, getUser, fetchCurrentUser, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, LogOut, LogIn } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "管理员",
  teacher: "教师",
  student: "学生",
};

export function DashboardNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // 先从本地获取用户信息
    const cached = getUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }
    // 异步刷新用户信息
    fetchCurrentUser()
      .then((u) => {
        if (u) setUser(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
        <LogIn className="mr-2 h-4 w-4" />
        登录
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <UserIcon className="mr-2 h-4 w-4" />
          {user.username}
          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {roleLabels[user.role] || user.role}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.username}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
