import { ICONS, type IconName } from "./icon-paths";

/** Extra line icons drawn for this site (no Figma export for these). 24×24, stroke = currentColor. */
const LINE_ICONS = {
  user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9c.6-3.9 3.9-6.5 8-6.5s7.4 2.6 8 6.5",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M5 5l14 14M19 5 5 19",
  home: "M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5.5v-6h-5v6H4a.5.5 0 0 1-.5-.5v-9.5Z",
  shop: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  eye: "M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  chevronDown: "m6 9 6 6 6-6",
  arrowRight: "M4 12h16m-6-6 6 6-6 6",
  filter: "M4 6h16M7 12h10M10 18h4",
} as const;

export type AnyIcon = IconName | keyof typeof LINE_ICONS;

export function Icon({ name, size = 20, className, strokeWidth = 1.6 }: { name: AnyIcon; size?: number; className?: string; strokeWidth?: number }) {
  if (name in LINE_ICONS) {
    const d = LINE_ICONS[name as keyof typeof LINE_ICONS];
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === "more" ? 3.2 : strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={d} />
      </svg>
    );
  }
  const icon = ICONS[name as IconName];
  const [, , w, h] = icon.viewBox.split(" ").map(Number);
  return (
    <svg aria-hidden="true" width={(size * w) / Math.max(w, h)} height={(size * h) / Math.max(w, h)} viewBox={icon.viewBox} fill="currentColor" className={className}>
      <g transform={icon.flip ? `matrix(1 0 0 -1 0 ${h})` : undefined}>
        {icon.paths.map((d) => (
          <path key={d.slice(0, 24)} d={d} />
        ))}
      </g>
    </svg>
  );
}
