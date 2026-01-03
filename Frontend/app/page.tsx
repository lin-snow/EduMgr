import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">EduMgr 教学管理系统</h1>
        <p className="mt-3 text-muted-foreground">
          这是课设实现项目。请先登录，然后进入管理面板。
        </p>
        <div className="mt-6 flex gap-4">
          <Button asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">管理面板</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
