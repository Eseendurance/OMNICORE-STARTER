"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Moon, Sun, Download } from "lucide-react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem("kivo-theme");
    } catch (error) {
      console.warn("Theme preference storage is unavailable:", error);
    }
    const preference: Theme = saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = preference;
    window.setTimeout(() => setTheme(preference), 0);
  }, []);

  const value = useMemo(() => ({
    theme,
    toggleTheme() {
      setTheme((current) => {
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          window.localStorage.setItem("kivo-theme", next);
        } catch (error) {
          console.warn("Could not save theme preference:", error);
        }
        return next;
      });
    },
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeToggle must be used inside ThemeProvider.");
  const Icon = context.theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={context.toggleTheme}
      aria-label={`Switch to ${context.theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${context.theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark-control"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .catch((error: unknown) => console.error("Kivo offline support could not start:", error));
    }

    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(displayMode.matches);
    updateInstalled();
    displayMode.addEventListener("change", updateInstalled);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", updateInstalled);
    return () => {
      displayMode.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", updateInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } catch (error) {
      console.error("Kivo app installation prompt failed:", error);
      setHelp(true);
    }
  }

  if (installed) return null;
  return (
    <div className="relative">
      <button type="button" onClick={install} className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-200 bg-white px-3 text-xs font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark-control">
        <Download size={15} aria-hidden="true" /> <span className="hidden sm:inline">Install Kivo</span><span className="sm:hidden">App</span>
      </button>
      {help && <div role="status" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-blue-200 bg-white p-3 text-xs leading-5 text-blue-900 shadow-lg dark-control">Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</div>}
    </div>
  );
}
