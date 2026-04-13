"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

import { BrandMark } from "@/components/BrandMark";
import { clearSession } from "@/services/auth";
import { SessionUser } from "@/types";

type Props = PropsWithChildren<{
  user: SessionUser;
  title: string;
  subtitle?: string;
}>;

export function DashboardShell({ user, title, subtitle, children }: Props) {
  const router = useRouter();

  const roleLabels = { teacher: "O‘qituvchi", student: "Talaba", parent: "Ota-ona" };

  const links = {
    teacher: [
      { href: "/teacher", label: "Boshqaruv paneli" },
      { href: "/teacher/courses/new", label: "Yangi kurs" }
    ],
    student: [
      { href: "/student", label: "Mening kurslarim" }
    ],
    parent: [
      { href: "/parent", label: "Farzand progressi" }
    ]
  }[user.role];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark compact subtitle="Bilimni isbotlaydigan platforma" />
        </div>
        <nav>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="content">
        <div className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            {subtitle ? <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p> : null}
          </div>
          <div className="btn-row">
            <div className="user-badge">{user.full_name} · {roleLabels[user.role]}</div>
            <button
              className="btn"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              Chiqish
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
