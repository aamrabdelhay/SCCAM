"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/format";

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  hint,
}: {
  items: T[];
  onReorder: (ordered: T[]) => void | Promise<void>;
  render: (item: T, index: number) => React.ReactNode;
  hint?: string;
}) {
  const [local, setLocal] = useState(items);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => setLocal(items), [items]);

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...local];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLocal(next);
  }

  function commit() {
    dragIndex.current = null;
    void onReorder(local);
  }

  return (
    <div>
      {hint && <p className="mb-2 text-[11px] text-[var(--muted)]">{hint}</p>}
      <ul className="space-y-1.5">
        {local.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={(e) => {
              dragIndex.current = index;
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex.current === null) return;
              if (dragIndex.current !== index) {
                move(dragIndex.current, index);
                dragIndex.current = index;
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              commit();
            }}
            onDragEnd={commit}
            className={cn(
              "flex cursor-grab items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 transition-colors active:cursor-grabbing",
              dragIndex.current === index && "opacity-70",
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <div className="min-w-0 flex-1">{render(item, index)}</div>
            <span className="w-8 shrink-0 text-end text-[10px] font-bold tabular-nums text-[var(--muted)]">{index + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
