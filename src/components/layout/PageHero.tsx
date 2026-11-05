import Link from "next/link";

/** Title band under the solid header on inner pages, in the hero blue. */
export function PageHero({ title, crumbs = [] }: { title: string; crumbs?: { href: string; label: string }[] }) {
  return (
    <div className="on-dark bg-hero text-white">
      <div className="mx-auto max-w-site px-[15px] pb-[34px] pt-[18px] lg:px-0 lg:pb-[46px]">
        <nav aria-label="Breadcrumb" className="text-[13px] leading-[20px] text-white/80">
          <ol className="flex flex-wrap gap-x-[8px]">
            <li>
              <Link href="/" className="hover:text-lime">
                Home
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.href} className="before:mr-[8px] before:content-['/']">
                <Link href={c.href} className="hover:text-lime">
                  {c.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-[10px] text-[34px] font-black uppercase leading-[1.1] lg:text-[48px]">{title}</h1>
      </div>
    </div>
  );
}
