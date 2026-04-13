import Link from "next/link";

export function CourseCard({
  title,
  subtitle,
  href,
  status,
  progress
}: {
  title: string;
  subtitle: string;
  href: string;
  status?: string;
  progress?: number;
}) {
  return (
    <div className="course-card">
      <div className="btn-row" style={{ justifyContent: "space-between" }}>
        <div className="badge">{status || "Faol"}</div>
        {typeof progress === "number" ? <div className="muted">{progress}%</div> : null}
      </div>
      <div>
        <h3 style={{ margin: "4px 0 8px 0" }}>{title}</h3>
        <p className="muted" style={{ margin: 0 }}>{subtitle}</p>
      </div>
      {typeof progress === "number" ? (
        <div className="progress-bar">
          <div className="progress-inner" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <Link href={href} className="btn primary">Ochish</Link>
    </div>
  );
}
