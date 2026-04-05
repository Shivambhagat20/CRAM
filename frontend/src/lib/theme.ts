export function setTheme(color: string) {
  document.documentElement.style.setProperty("--secondary", color);

  document.documentElement.style.setProperty(
    "--secondary-foreground",
    "oklch(0.205 0 0)"
  );

  localStorage.setItem("theme", color);
}

export function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    setTheme(saved);
  }
}
