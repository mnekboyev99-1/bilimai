import Image from "next/image";
import Link from "next/link";

type Props = {
  compact?: boolean;
  href?: string;
  subtitle?: string;
};

export function BrandMark({ compact = false, href = "/", subtitle }: Props) {
  const content = (
    <div className={`brand-mark${compact ? " compact" : ""}`}>
      <div className="brand-logo-wrap">
        <Image src="/logo.png" alt="BilimAI logo" width={compact ? 42 : 72} height={compact ? 42 : 72} className="brand-logo" />
      </div>
      <div>
        <div className="brand-title">BilimAI</div>
        {subtitle ? <div className="brand-subtitle">{subtitle}</div> : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
