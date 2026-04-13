import { BrandMark } from "@/components/BrandMark";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="page-shell" style={{ maxWidth: 640 }}>
      <div style={{ height: 48 }} />
      <section className="hero">
        <BrandMark subtitle="Teacher, student va parent uchun yagona platforma" />
        <div className="pill">BilimAI mahsuloti</div>
        <h1 style={{ marginTop: 0 }}>Tizimga kirib, o'z rolingiz bo'yicha ishni boshlang</h1>
        <p>
          O'qituvchi kurs yaratadi, talaba bilimini isbotlaydi, ota-ona esa natijani aniq ko'radi.
        </p>
      </section>
      <div style={{ height: 20 }} />
      <LoginForm />
    </main>
  );
}
