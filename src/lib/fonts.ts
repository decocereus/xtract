import {
  IM_Fell_English,
  Instrument_Sans,
  Newsreader,
  UnifrakturCook,
} from "next/font/google";

export const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const heading = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

export const manuscriptBody = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-manuscript-body",
  display: "swap",
});

export const manuscriptDisplay = UnifrakturCook({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-manuscript-display",
  display: "swap",
});
