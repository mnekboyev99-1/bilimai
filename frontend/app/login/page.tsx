import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 560 }}>
      <div style={{ height: 60 }} />
      <section className="hero">
        <div className="pill">BilimAI mahsuloti</div>
        <h1 style={{ marginTop: 0 }}>Tizimga kirib, o‘z rolingiz bo‘yicha ishni boshlang</h1>
        <p>O‘qituvchi kurs yaratadi. Talaba bilimini isbotlaydi. Ota-ona o‘quv holatini ko‘radi.</p>
      </section>
      <div style={{ height: 20 }} />
      <LoginForm />
    </main>
  );
}
