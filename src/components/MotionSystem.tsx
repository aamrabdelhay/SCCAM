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
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.remove("motion-ready", "motion-reduced");

    const groups = document.querySelectorAll<HTMLElement>("[data-motion-stagger]");
    groups.forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty("--motion-index", String(Math.min(index, 8)));
      });
    });

    const targets = new Set<HTMLElement>();
    document.querySelectorAll<HTMLElement>(
      "main > *, main section, main article, main .card, main .card-hover, [data-motion-reveal], [data-motion-stagger] > *",
    ).forEach((element) => targets.add(element));

    targets.forEach((element) => {
      element.dataset.motionState = "hidden";
    });

    root.classList.toggle("motion-reduced", reducedMotion);
    root.classList.add("motion-ready");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((element) => {
        element.dataset.motionState = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.dataset.motionState = "visible";
        observer.unobserve(element);
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -8% 0px",
    });

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return <div ref={progressRef} className="scroll-progress" aria-hidden="true" />;
}
