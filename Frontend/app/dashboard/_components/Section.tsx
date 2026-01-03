export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

