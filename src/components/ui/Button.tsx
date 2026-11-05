import Link from "next/link";

/** Lime button with royal-blue text — the mockup's primary call to action. */
export function LimeButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-[44px] items-center justify-center bg-lime px-[28px] text-[14px] font-bold uppercase leading-[16px] tracking-[1px] text-royal transition-colors hover:bg-[#b8e600] ${className}`}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-[34px] font-black uppercase leading-[1.1] text-ink md:text-[48px] md:leading-[52.8px] ${className}`}>{children}</h2>;
}
