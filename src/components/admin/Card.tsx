export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line p-[20px]">
      <h2 className="text-[16px] font-bold uppercase tracking-[1px] text-ink">{title}</h2>
      <div className="mt-[14px] text-[15px] leading-[22px] text-body">{children}</div>
    </section>
  );
}

export const adminInput = "h-[36px] w-[90px] border border-line px-[8px] text-ink";
export const adminButton = "inline-flex h-[38px] items-center bg-royal px-[18px] text-[14px] font-bold text-white hover:bg-[#0b4a8f]";
export const dangerButton = "inline-flex h-[38px] items-center bg-[#c0392b] px-[18px] text-[14px] font-bold text-white hover:bg-[#a93226]";
