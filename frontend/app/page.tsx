import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";

export default function LandingPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <BrandMark subtitle="AI-powered verifiable learning platform" />
        <div className="pill">Yangi kategoriya: isbotlanadigan ta'lim</div>
        <h1 style={{ marginTop: 0 }}>BilimAI kurs yetkazmaydi, tushunganingizni isbotlatadi.</h1>
        <p>
          Platforma PDF, DOCX yoki prompt asosida kurs yaratadi, keyin SHOGIRD AI va Bilim MRI orqali
          talabaning haqiqiy tushunishini tekshiradi. O'qituvchi aralashadi, talaba o'rganadi, ota-ona esa
          aniq progressni ko'radi.
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <Link href="/login" className="btn primary">Tizimga kirish</Link>
          <a href="#capabilities" className="btn ghost">Imkoniyatlarni ko'rish</a>
        </div>
      </section>

      <div style={{ height: 24 }} />

      <section id="capabilities" className="grid-3">
        <div className="surface feature-card">
          <h3>SHOGIRD AI</h3>
          <p className="muted">
            Talaba AI o'quvchini o'qitadi. Tizim follow-up savollar bilan yuzaki javobni ajratib oladi.
          </p>
        </div>
        <div className="surface feature-card">
          <h3>Bilim MRI</h3>
          <p className="muted">
            Concept graph asosida ichki tushuncha tuzilmasi tekshiriladi va bo'shliqlar ko'rsatiladi.
          </p>
        </div>
        <div className="surface feature-card">
          <h3>Har rol uchun alohida tajriba</h3>
          <p className="muted">
            O'qituvchi, talaba va ota-ona uchun alohida, sodda va maqsadga yo'naltirilgan interfeys mavjud.
          </p>
        </div>
      </section>
    </main>
  );
}
