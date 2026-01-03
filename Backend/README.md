## EduMgr Backend（Go + Echo + GORM）

### 环境变量

参考 `Backend/env.example`。

### 数据库迁移（golang-migrate）

本仓库提供 `Backend/migrations/` 作为迁移文件目录。\n
你可以使用 `golang-migrate` CLI（或自己写一个 migrate runner）执行迁移。\n
示例（仅示意，按你的本地实际 DSN 调整）：\n
\n
```bash
migrate -path ./migrations -database \"postgres://edumgr:edumgr@localhost:5432/edumgr?sslmode=disable\" up
```\n

### 运行

（在可联网/可安装依赖的环境下）

```bash
go mod tidy
go run ./cmd/api
```

