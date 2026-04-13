import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="pill">Yangi kategoriya: isbotlanadigan ta’lim</div>
        <h1 style={{ marginTop: 0 }}>BilimAI — kurs yetkazish emas, bilimni isbotlash.</h1>
        <p>
          BilimAI PDF va matndan to‘liq kurs yaratadi, so‘ng talabadan mavzuni haqiqatan tushunganini
          SHOGIRD AI va Bilim MRI orqali isbotlashni so‘raydi. O‘qituvchi nazorat qiladi, talaba o‘rganadi,
          ota-ona esa aniq o‘quv holatini ko‘radi.
        </p>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <Link href="/login" className="btn primary">Tizimga kirish</Link>
        </div>
      </section>

      <div style={{ height: 24 }} />

      <section className="grid-3">
        <div className="surface">
          <h3>SHOGIRD AI</h3>
          <p className="muted">
            Talaba AI-o‘quvchini o‘qitadi. AI esa yuzaki javobga ishonmaydi va follow-up savollar bilan
            tushunishni tekshiradi.
          </p>
        </div>
        <div className="surface">
          <h3>Bilim MRI</h3>
          <p className="muted">
            Tizim mavzu bo‘yicha concept graph quradi. Talaba bog‘lanishlarni qayta tiklaydi, platforma esa
            tushunishdagi bo‘shliqlarni ko‘rsatadi.
          </p>
        </div>
        <div className="surface">
          <h3>3 rol, 3 alohida tajriba</h3>
          <p className="muted">
            Har bir rol uchun alohida, toza va aniq interfeys. Foydalanuvchi faqat o‘ziga tegishli funksiyalarni ko‘radi.
          </p>
        </div>
      </section>
    </main>
  );
}
