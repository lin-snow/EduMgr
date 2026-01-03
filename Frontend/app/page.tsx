import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">EduMgr 教学管理系统</h1>
        <p className="mt-3 text-muted-foreground">
          这是课设实现项目。请先登录，然后进入管理面板。
        </p>
        <div className="mt-6 flex gap-4">
          <Link className="rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/login">
            登录
          </Link>
          <Link className="rounded-md border border-border px-4 py-2" href="/dashboard">
            管理面板
          </Link>
        </div>
      </div>
    </main>
  );
}
