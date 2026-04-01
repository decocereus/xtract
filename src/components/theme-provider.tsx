"use client";

import type { ReactNode } from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

const THEME_STORAGE_KEY = "xtract-theme";

type AppThemeProviderProps = Omit<ThemeProviderProps, "children"> & {
  children: ReactNode;
};

export function ThemeProvider({
  children,
  ...props
}: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
