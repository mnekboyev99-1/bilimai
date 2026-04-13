export function LoadingState({ label = "Yuklanmoqda..." }: { label?: string }) {
  return (
    <div className="loading">
      <span className="loader" />
      <span>{label}</span>
    </div>
  );
}
