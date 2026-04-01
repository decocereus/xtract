"use client";

import { startTransition } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = event.clientX === 0 ? rect.left + rect.width / 2 : event.clientX;
    const originY = event.clientY === 0 ? rect.top + rect.height / 2 : event.clientY;
    const maxX = Math.max(originX, window.innerWidth - originX);
    const maxY = Math.max(originY, window.innerHeight - originY);
    const radius = Math.hypot(maxX, maxY);

    const commitTheme = () => {
      root.classList.toggle("dark", nextTheme === "dark");
      root.style.colorScheme = nextTheme;

      startTransition(() => {
        setTheme(nextTheme);
      });
    };

    const motionReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startViewTransition = (
      document as Document & {
        startViewTransition?: (callback: () => void | Promise<void>) => {
          finished: Promise<void>;
        };
      }
    ).startViewTransition;

    if (!startViewTransition || motionReduced) {
      commitTheme();
      return;
    }

    root.style.setProperty("--theme-transition-x", `${originX}px`);
    root.style.setProperty("--theme-transition-y", `${originY}px`);
    root.style.setProperty("--theme-transition-radius", `${radius}px`);

    const transition = startViewTransition.call(document, () => {
      commitTheme();
    });

    transition.finished.finally(() => {
      root.style.removeProperty("--theme-transition-x");
      root.style.removeProperty("--theme-transition-y");
      root.style.removeProperty("--theme-transition-radius");
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="ink-action h-9 rounded-full border-white/65 bg-background/78 px-3 shadow-sm shadow-black/5 backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-foreground/88 dark:shadow-black/25 dark:hover:border-primary/30 dark:hover:bg-white/[0.06] dark:hover:text-foreground"
      aria-label="Toggle color mode"
      title="Toggle color mode"
    >
      <span className="relative grid size-4 place-items-center">
        <SunMedium
          aria-hidden="true"
          className="absolute size-4 rotate-0 scale-100 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:-rotate-90 dark:scale-0 dark:opacity-0"
        />
        <MoonStar
          aria-hidden="true"
          className="absolute size-4 rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:rotate-0 dark:scale-100 dark:opacity-100"
        />
      </span>
      <span>Theme</span>
    </Button>
  );
}
