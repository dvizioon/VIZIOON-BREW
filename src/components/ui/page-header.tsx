export function PageHeader({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      {title || description ? (
        <div>
          {title ? <h1 className="font-display text-3xl tracking-tight">{title}</h1> : null}
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {action}
    </div>
  );
}
