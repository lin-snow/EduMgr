## EduMgr Frontend（Next.js + Tailwind v4 + pnpm）

### 环境变量

复制 `Frontend/env.example` 为 `Frontend/.env.local`（或用你自己的方式注入环境变量），并按需修改：

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

### 安装与运行（本地）

在 `Frontend/` 目录下：

```bash
corepack enable
pnpm install
pnpm dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080/healthz`

### 页面入口

- `/login`：登录（获取 JWT，存储在 localStorage）
- `/dashboard`：管理面板入口
- `/dashboard/*`：系/学生/教职工/课程/选课/成绩/报表（最小可用实现，对齐 PRD）

### 注意事项

- 写操作需要 `admin`（后端会拦截非 admin 的 POST/PUT/DELETE）
- 选课页面目前只做“提交选课”；若要展示“选课列表并退课”，需要后端提供 enrollments 查询接口
