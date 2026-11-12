/** Small line-based diff (LCS) used by the version comparison screen. */
export type DiffOp = { type: "equal" | "add" | "remove"; text: string; aLine?: number; bLine?: number };

export function diffLines(a: string, b: string, maxLines = 6000): DiffOp[] {
  const A = a.split("\n").slice(0, maxLines);
  const B = b.split("\n").slice(0, maxLines);
  const n = A.length;
  const m = B.length;

  // Guard: for very large docs fall back to a coarse comparison.
  if (n * m > 4_000_000) {
    return [
      ...A.map((text, i) => ({ type: "remove" as const, text, aLine: i + 1 })),
      ...B.map((text, i) => ({ type: "add" as const, text, bLine: i + 1 })),
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i].trim() === B[j].trim() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i].trim() === B[j].trim()) {
      ops.push({ type: "equal", text: A[i], aLine: i + 1, bLine: j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "remove", text: A[i], aLine: i + 1 });
      i++;
    } else {
      ops.push({ type: "add", text: B[j], bLine: j + 1 });
      j++;
    }
  }
  while (i < n) ops.push({ type: "remove", text: A[i], aLine: ++i });
  while (j < m) ops.push({ type: "add", text: B[j], bLine: ++j });
  return ops;
}

export function diffStats(ops: DiffOp[]) {
  return ops.reduce(
    (acc, op) => {
      if (op.type === "add") acc.added++;
      else if (op.type === "remove") acc.removed++;
      else acc.same++;
      return acc;
    },
    { added: 0, removed: 0, same: 0 },
  );
}
