export const ksh = (n: number | string | null | undefined) =>
  `KSh ${Number(n ?? 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";

export const fmtTime = (t: string | null | undefined) => {
  if (!t) return "";
  const [h = 0, m = 0] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ampm}`;
};

export const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export const CATEGORIES = ["All", "Music", "Festivals", "Comedy", "Sports", "Conferences", "Cultural"] as const;
