/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        accent: "var(--accent)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        line: "var(--line)",
        text: "var(--text)",
        muted: "var(--muted)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px -12px rgba(16,24,40,.18)",
        lift: "0 12px 40px -16px rgba(11,61,46,.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .35s ease both",
        "slide-in": "slide-in .4s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};
