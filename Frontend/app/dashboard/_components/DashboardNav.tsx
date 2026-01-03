"use client";

import { useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function DashboardNav() {
  const router = useRouter();
  const token = getToken();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-xs text-muted-foreground md:block">
        {token ? "已登录" : "未登录"}
      </div>
      <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
        登录
      </Button>
      <Button
        size="sm"
        onClick={() => {
          clearToken();
          router.push("/login");
        }}
      >
        退出
      </Button>
    </div>
  );
}

