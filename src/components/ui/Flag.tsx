/** 20×15 flags. GB is the Figma export; EU and US are drawn here in the same size. */
export function Flag({ code }: { code: "gb" | "eu" | "us" }) {
  if (code === "gb") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/images/flags/gb.svg" alt="" width={20} height={15} className="block h-[15px] w-[20px] shrink-0" />;
  }
  if (code === "eu") {
    const stars = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={(10 + Math.sin(a) * 4.6).toFixed(2)} cy={(7.5 - Math.cos(a) * 4.6).toFixed(2)} r={0.75} fill="#ffcc00" />;
    });
    return (
      <svg aria-hidden="true" width={20} height={15} viewBox="0 0 20 15" className="block shrink-0">
        <rect width="20" height="15" fill="#003399" />
        {stars}
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width={20} height={15} viewBox="0 0 20 15" className="block shrink-0">
      <rect width="20" height="15" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 15) / 13} width="20" height={15 / 13} fill="#b22234" />
      ))}
      <rect width="9" height={(7 * 15) / 13} fill="#3c3b6e" />
    </svg>
  );
}
