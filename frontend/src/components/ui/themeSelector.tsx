import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { setTheme } from "@/lib/theme";

const DEFAULT_THEME = "#f4d35e";

const PRESET_THEMES = [
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#EF4444",
  "#F97316",
];

// Lets the user select a theme color for the site.
export default function ThemeSelector() {
  const [color, setColor] = useState(() => {
    if (typeof globalThis === "undefined" || typeof globalThis.window === "undefined") {
      return DEFAULT_THEME;
    }
    return localStorage.getItem("theme") ?? DEFAULT_THEME;
  });
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const applyTheme = (nextColor: string) => {
    setColor(nextColor);
    setTheme(nextColor);
  };

  const handleReset = () => {
    localStorage.removeItem("theme");
    applyTheme(DEFAULT_THEME);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex h-8 w-8 items-center justify-center rounded-full
          border border-secondary/40
          hover:scale-110 transition-transform
        "
        title="Theme"
        aria-label="Open theme picker"
      >
        <Palette className="h-4 w-4 text-secondary" />
      </button>

      {open && (
        <div
          className="
            absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50
            rounded-xl border border-secondary/20
            bg-background/95 backdrop-blur
            px-3 py-2 shadow-lg
          "
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="
                h-6 w-6 rounded-full border border-secondary/40
                hover:scale-110 transition-transform
              "
              style={{ backgroundColor: DEFAULT_THEME }}
              title="Default theme"
              aria-label="Default theme"
            />

            {PRESET_THEMES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyTheme(preset)}
                className="
                  h-6 w-6 rounded-full border border-secondary/40
                  hover:scale-110 transition-transform
                "
                style={{ backgroundColor: preset }}
                title={`Set theme to ${preset}`}
                aria-label={`Set theme to ${preset}`}
              />
            ))}

            <label
              className="
                relative h-6 w-6 cursor-pointer rounded-full
                overflow-hidden border border-secondary/40
                hover:scale-110 transition-transform
              "
              title="Pick a custom color"
              aria-label="Pick a custom color"
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => applyTheme(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick theme color"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
