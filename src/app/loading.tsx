import { LogoMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="container-x grid min-h-[48vh] place-items-center" role="status" aria-live="polite">
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <LogoMark className="page-loading-mark h-14 w-14" />
        <span className="font-display text-[13px] font-extrabold tracking-[0.2em] text-[var(--brand-navy)]">SCCAM</span>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-[var(--line)]">
          <div className="page-loading-line h-full w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}
