import { manuscriptBody } from "@/lib/fonts";

export type SceneVariant = "markdown" | "text" | "json";

export type SceneThemeMode = "light" | "dark";

export type Interval = {
  left: number;
  right: number;
};

type Run = {
  start: number;
  end: number;
};

export type AsciiMask = {
  rows: string[];
  widthChars: number;
  heightRows: number;
  rowRuns: Run[][];
};

type SceneTypography = {
  textFont: string;
  lineHeight: number;
  artFont: string;
  artLineHeight: number;
  paddingX: number;
  paddingTop: number;
  paddingBottom: number;
  minSlotWidth: number;
  artPaddingX: number;
  artPaddingY: number;
};

type SceneMotion = {
  anchorX: number;
  anchorY: number;
  amplitudeX: number;
  amplitudeY: number;
  speedX: number;
  speedY: number;
  phaseX: number;
  phaseY: number;
};

export type SceneThemeSpec = {
  title: string;
  kicker: string;
  ascii: string;
  artInk: string;
  artGlow: string;
  backgroundStart: string;
  backgroundEnd: string;
  grid: string;
  badge: string;
  haze: string;
  accent: string;
  lineColor: string;
  lineMuted: string;
};

type SceneConfig = {
  label: string;
  desktop: SceneTypography;
  compact: SceneTypography;
  motion: SceneMotion;
  artMode?: "ascii" | "dragon" | "codex" | "core";
  wrapMode?: "split" | "single";
  artBox?: {
    widthFraction: number;
    minWidth: number;
    maxWidth: number;
    aspectRatio: number;
  };
  initialMode?: "none" | "manuscript";
  metaMode?: "default" | "minimal" | "none";
  themes: Record<SceneThemeMode, SceneThemeSpec>;
};

const monoFamily =
  '"SFMono-Regular", "Cascadia Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const textSerifFamily = 'Georgia, "Times New Roman", Times, serif';
const manuscriptBodyFamily = `${manuscriptBody.style.fontFamily}, ${textSerifFamily}`;

function rows(lines: string[]) {
  return lines.join("\n");
}

export const SCENE_CONFIGS: Record<SceneVariant, SceneConfig> = {
  markdown: {
    label: "Markdown",
    artMode: "codex",
    wrapMode: "single",
    artBox: {
      widthFraction: 0.22,
      minWidth: 160,
      maxWidth: 220,
      aspectRatio: 1.42,
    },
    metaMode: "none",
    desktop: {
      textFont: `500 13px ${monoFamily}`,
      lineHeight: 22,
      artFont: `700 12px ${monoFamily}`,
      artLineHeight: 16,
      paddingX: 22,
      paddingTop: 28,
      paddingBottom: 26,
      minSlotWidth: 88,
      artPaddingX: 8,
      artPaddingY: 7,
    },
    compact: {
      textFont: `500 12px ${monoFamily}`,
      lineHeight: 20,
      artFont: `700 10px ${monoFamily}`,
      artLineHeight: 14,
      paddingX: 16,
      paddingTop: 22,
      paddingBottom: 22,
      minSlotWidth: 66,
      artPaddingX: 6,
      artPaddingY: 6,
    },
    motion: {
      anchorX: 0.74,
      anchorY: 138,
      amplitudeX: 5,
      amplitudeY: 4,
      speedX: 0.16,
      speedY: 0.14,
      phaseX: 0.3,
      phaseY: 1.1,
    },
    themes: {
      light: {
        title: "Field Notes",
        kicker: "a paper automaton bending markdown into columns",
        ascii: rows([
          "           .--.________________.",
          '        .-"  .\'              /|',
          '      .\'    /   .-"""-.     / |',
          "     /     /   /  _  _ \\   /  |",
          "    ;     ;   |  (o)(o) | ;   |",
          "    |     |   |   ____  | |   |",
          "    ;     ;   |  (____) | ;  /",
          "     \\     \\   \\        / /  /",
          "      '.    '.  '-.__.-' / .'",
          "        '-._  '-._____.-'/",
        ]),
        artInk: "rgba(54, 61, 76, 0.84)",
        artGlow: "rgba(145, 156, 184, 0.18)",
        backgroundStart: "rgba(246, 244, 239, 0.99)",
        backgroundEnd: "rgba(236, 233, 226, 0.88)",
        grid: "rgba(106, 113, 129, 0.08)",
        badge: "rgba(125, 133, 152, 0.1)",
        haze: "rgba(170, 179, 202, 0.14)",
        accent: "rgba(112, 123, 154, 0.86)",
        lineColor: "rgba(38, 42, 51, 0.98)",
        lineMuted: "rgba(84, 91, 107, 0.72)",
      },
      dark: {
        title: "Midnight Codex",
        kicker: "denser glyph pressure, warmer sparks, tighter rails",
        ascii: rows([
          "           ______________________",
          "       .-'/____________________/|",
          "      / / / .---.  .---.     / /",
          "     / / / /_   _\\/_   _\\   / /",
          "    / / / ((o) (o) (o) )   / /",
          "   / / /  \\     ^     /   / /",
          "  /_/ /____'._______.'___/ /",
          "  \\ \\____________________\\/",
          "   '----------------------'",
        ]),
        artInk: "rgba(188, 197, 215, 0.84)",
        artGlow: "rgba(118, 133, 172, 0.16)",
        backgroundStart: "rgba(21, 24, 31, 0.98)",
        backgroundEnd: "rgba(16, 19, 25, 0.9)",
        grid: "rgba(103, 114, 138, 0.08)",
        badge: "rgba(95, 106, 130, 0.1)",
        haze: "rgba(74, 87, 120, 0.12)",
        accent: "rgba(154, 165, 198, 0.86)",
        lineColor: "rgba(229, 232, 239, 0.96)",
        lineMuted: "rgba(154, 163, 180, 0.72)",
      },
    },
  },
  text: {
    label: "Text",
    artMode: "dragon",
    wrapMode: "single",
    artBox: {
      widthFraction: 0.23,
      minWidth: 150,
      maxWidth: 218,
      aspectRatio: 1.78,
    },
    initialMode: "none",
    metaMode: "none",
    desktop: {
      textFont: `400 20px ${manuscriptBodyFamily}`,
      lineHeight: 38,
      artFont: `700 8px ${monoFamily}`,
      artLineHeight: 10,
      paddingX: 28,
      paddingTop: 58,
      paddingBottom: 34,
      minSlotWidth: 126,
      artPaddingX: 8,
      artPaddingY: 7,
    },
    compact: {
      textFont: `400 18px ${manuscriptBodyFamily}`,
      lineHeight: 34,
      artFont: `700 7px ${monoFamily}`,
      artLineHeight: 8,
      paddingX: 20,
      paddingTop: 50,
      paddingBottom: 24,
      minSlotWidth: 92,
      artPaddingX: 6,
      artPaddingY: 6,
    },
    motion: {
      anchorX: 0.73,
      anchorY: 150,
      amplitudeX: 6,
      amplitudeY: 5,
      speedX: 0.15,
      speedY: 0.13,
      phaseX: 1.7,
      phaseY: 0.2,
    },
    themes: {
      light: {
        title: "Bestiary Leaf",
        kicker: "ink, ash, and a dragon caught between the lines",
        ascii: rows([
          "                         ######                          ",
          "                    ##################                   ",
          "               ############################              ",
          "          ######################################         ",
          "       #############################################     ",
          "   ###########################################   ####    ",
          " ##########################################       ####   ",
          "  #######################################          ###   ",
          "   #####################################          ###    ",
          "    ###################################         ####     ",
          "      ###############################       ######       ",
          "        ###########################     #######          ",
          "          #######################   #######             ",
          "           ##################### ######                 ",
          "             ########################                   ",
          "                ###################                     ",
          "                  ###############                       ",
          "                    ###########                         ",
          "                     #######                            ",
        ]),
        artInk: "rgba(46, 48, 56, 0.9)",
        artGlow: "rgba(153, 164, 196, 0.18)",
        backgroundStart: "rgba(245, 241, 234, 0.99)",
        backgroundEnd: "rgba(235, 230, 221, 0.9)",
        grid: "rgba(101, 109, 124, 0.06)",
        badge: "rgba(122, 130, 147, 0.1)",
        haze: "rgba(168, 179, 204, 0.12)",
        accent: "rgba(115, 125, 156, 0.88)",
        lineColor: "rgba(33, 36, 43, 0.98)",
        lineMuted: "rgba(83, 88, 102, 0.76)",
      },
      dark: {
        title: "Night Scriptorium",
        kicker: "moonlit vellum, silver ink, and a colder dragon",
        ascii: rows([
          "                         ######                          ",
          "                    ##################                   ",
          "               ############################              ",
          "          ######################################         ",
          "       #############################################     ",
          "   ###########################################   ####    ",
          " ##########################################       ####   ",
          "  #######################################          ###   ",
          "   #####################################          ###    ",
          "    ###################################         ####     ",
          "      ###############################       ######       ",
          "        ###########################     #######          ",
          "          #######################   #######             ",
          "           ##################### ######                 ",
          "             ########################                   ",
          "                ###################                     ",
          "                  ###############                       ",
          "                    ###########                         ",
          "                     #######                            ",
        ]),
        artInk: "rgba(206, 213, 227, 0.9)",
        artGlow: "rgba(127, 143, 184, 0.16)",
        backgroundStart: "rgba(23, 27, 34, 0.98)",
        backgroundEnd: "rgba(17, 21, 27, 0.92)",
        grid: "rgba(111, 121, 145, 0.07)",
        badge: "rgba(104, 115, 136, 0.1)",
        haze: "rgba(77, 91, 126, 0.12)",
        accent: "rgba(161, 171, 203, 0.88)",
        lineColor: "rgba(230, 233, 239, 0.96)",
        lineMuted: "rgba(158, 164, 177, 0.72)",
      },
    },
  },
  json: {
    label: "JSON",
    artMode: "core",
    wrapMode: "single",
    artBox: {
      widthFraction: 0.2,
      minWidth: 140,
      maxWidth: 196,
      aspectRatio: 1.08,
    },
    metaMode: "none",
    desktop: {
      textFont: `500 12.5px ${monoFamily}`,
      lineHeight: 21,
      artFont: `700 12px ${monoFamily}`,
      artLineHeight: 16,
      paddingX: 22,
      paddingTop: 26,
      paddingBottom: 26,
      minSlotWidth: 92,
      artPaddingX: 8,
      artPaddingY: 7,
    },
    compact: {
      textFont: `500 11px ${monoFamily}`,
      lineHeight: 18,
      artFont: `700 10px ${monoFamily}`,
      artLineHeight: 14,
      paddingX: 16,
      paddingTop: 22,
      paddingBottom: 22,
      minSlotWidth: 68,
      artPaddingX: 6,
      artPaddingY: 6,
    },
    motion: {
      anchorX: 0.76,
      anchorY: 134,
      amplitudeX: 5,
      amplitudeY: 4,
      speedX: 0.14,
      speedY: 0.13,
      phaseX: 2,
      phaseY: 0.8,
    },
    themes: {
      light: {
        title: "Glass Node",
        kicker: "structured output folding around a low-latency cube",
        ascii: rows([
          "               +--------+",
          "              /  .--.  /|",
          "             +--------+ |",
          "             |  |{}| | |",
          "             |  |[]| | +",
          "             |  '--' |/",
          "             +-------+",
        ]),
        artInk: "rgba(56, 67, 84, 0.84)",
        artGlow: "rgba(145, 160, 192, 0.18)",
        backgroundStart: "rgba(243, 246, 248, 0.99)",
        backgroundEnd: "rgba(233, 238, 242, 0.88)",
        grid: "rgba(105, 116, 136, 0.08)",
        badge: "rgba(124, 136, 156, 0.1)",
        haze: "rgba(168, 183, 207, 0.14)",
        accent: "rgba(111, 125, 159, 0.86)",
        lineColor: "rgba(38, 45, 56, 0.98)",
        lineMuted: "rgba(85, 95, 112, 0.72)",
      },
      dark: {
        title: "Reactor Mesh",
        kicker: "phosphor monospace lines orbiting a stricter core",
        ascii: rows([
          "             .-=========-.",
          "             \\'-=======-'/",
          "             _|   .-.   |_",
          "            ((|  (0 0)  |))",
          "             \\|   \\_/   |/",
          "              \\__ ___ __/",
          "            _.'  /___\\  `._",
        ]),
        artInk: "rgba(190, 201, 220, 0.84)",
        artGlow: "rgba(120, 137, 178, 0.14)",
        backgroundStart: "rgba(21, 25, 32, 0.98)",
        backgroundEnd: "rgba(16, 20, 26, 0.9)",
        grid: "rgba(103, 116, 140, 0.08)",
        badge: "rgba(96, 108, 131, 0.1)",
        haze: "rgba(76, 90, 122, 0.12)",
        accent: "rgba(156, 168, 202, 0.86)",
        lineColor: "rgba(228, 232, 240, 0.96)",
        lineMuted: "rgba(155, 164, 180, 0.72)",
      },
    },
  },
};

export function getSceneTypography(
  variant: SceneVariant,
  isCompact: boolean,
): SceneTypography {
  return isCompact
    ? SCENE_CONFIGS[variant].compact
    : SCENE_CONFIGS[variant].desktop;
}

export function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function parseAsciiArt(ascii: string): AsciiMask {
  const normalized = ascii.replace(/^\n+/, "").replace(/\n+\s*$/, "");
  const baseRows = normalized.length === 0 ? [""] : normalized.split("\n");
  const minIndent = baseRows.reduce((smallest, row) => {
    if (row.trim().length === 0) {
      return smallest;
    }

    const leadingSpaces = row.match(/^ */)?.[0].length ?? 0;
    return Math.min(smallest, leadingSpaces);
  }, Number.POSITIVE_INFINITY);
  const safeIndent = Number.isFinite(minIndent) ? minIndent : 0;
  const rows = baseRows.map((row) => row.slice(safeIndent).replace(/\s+$/, ""));
  const widthChars = rows.reduce(
    (largest, row) => Math.max(largest, row.length),
    0,
  );
  const paddedRows = rows.map((row) => row.padEnd(widthChars, " "));
  const rowRuns = paddedRows.map((row) => {
    const runs: Run[] = [];
    let start = -1;

    for (let index = 0; index < row.length; index += 1) {
      if (row[index] !== " ") {
        if (start === -1) {
          start = index;
        }

        continue;
      }

      if (start !== -1) {
        runs.push({ start, end: index });
        start = -1;
      }
    }

    if (start !== -1) {
      runs.push({ start, end: row.length });
    }

    return runs;
  });

  return {
    rows: paddedRows,
    widthChars,
    heightRows: paddedRows.length,
    rowRuns,
  };
}

export function mergeIntervals(intervals: Interval[]) {
  if (intervals.length <= 1) {
    return intervals;
  }

  const sorted = [...intervals].sort((left, right) => left.left - right.left);
  const merged: Interval[] = [sorted[0]!];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    const previous = merged[merged.length - 1]!;

    if (current.left <= previous.right) {
      previous.right = Math.max(previous.right, current.right);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

export function carveTextLineSlots(
  base: Interval,
  blocked: Interval[],
  minWidth: number,
) {
  let slots: Interval[] = [base];

  for (let blockedIndex = 0; blockedIndex < blocked.length; blockedIndex += 1) {
    const interval = blocked[blockedIndex]!;
    const next: Interval[] = [];

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const slot = slots[slotIndex]!;

      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot);
        continue;
      }

      if (interval.left > slot.left) {
        next.push({ left: slot.left, right: interval.left });
      }

      if (interval.right < slot.right) {
        next.push({ left: interval.right, right: slot.right });
      }
    }

    slots = next;
  }

  return slots.filter((slot) => slot.right - slot.left >= minWidth);
}
