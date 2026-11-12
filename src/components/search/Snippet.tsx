import type { Snippet as SnippetType } from "@/lib/search";

export function Snippet({ snippet, dir = "auto" }: { snippet: SnippetType; dir?: "auto" | "rtl" | "ltr" }) {
  if (!snippet.text) return null;
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  snippet.ranges.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(snippet.text.slice(cursor, start));
    nodes.push(<mark key={i}>{snippet.text.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < snippet.text.length) nodes.push(snippet.text.slice(cursor));
  return (
    <p className="text-[12.5px] leading-relaxed text-[var(--muted)]" dir={dir}>
      {nodes}
    </p>
  );
}
