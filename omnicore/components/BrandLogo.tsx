import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="KiVo home">
      <Image
        src="/kivo-logo.png"
        alt="KiVo"
        width={compact ? 38 : 52}
        height={compact ? 28 : 38}
        className="rounded-md object-cover object-top"
        priority
      />
      {!compact && <span className="font-display text-xl font-bold text-sky">KiVo</span>}
    </Link>
  );
}
