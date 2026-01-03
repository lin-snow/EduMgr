# ==================== Build Stage ====================
FROM golang:1.23-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy dependency files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /out/api ./cmd/api

# ==================== Production Stage ====================
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS and timezone data
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from build stage
COPY --from=build /out/api /app/api

# Copy migrations for database setup
COPY --from=build /app/migrations /app/migrations

# Create non-root user
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/api"]

