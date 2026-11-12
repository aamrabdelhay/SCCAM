"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function MotionSystem() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    let frame = 0;
    const updateProgress = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const root = document.documentElement;
        const total = Math.max(1, root.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / total));
        bar.style.transform = "scaleX(" + progress + ")";
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("motion-ready");
      return;
    }
    document.documentElement.classList.add("motion-ready");
    const groups = document.querySelectorAll<HTMLElement>("[data-motion-stagger]");
    groups.forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty("--motion-index", String(Math.min(index, 8)));
      });
    });
    const targets = document.querySelectorAll<HTMLElement>("[data-motion-reveal], .card-hover, [data-motion-stagger] > *");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target as HTMLElement;
        node.dataset.motionState = "visible";
        observer.unobserve(node);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -36px 0px" });
    targets.forEach((node) => {
      if (node.dataset.motionObserved === "true") return;
      node.dataset.motionObserved = "true";
      node.dataset.motionState = "hidden";
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return <div ref={progressRef} className="scroll-progress" aria-hidden="true" />;
}
