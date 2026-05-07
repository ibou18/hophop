"use client";

/**
 * Enregistrement central des plugins GSAP utilisés sur la landing.
 * À importer une seule fois par page cliente qui en a besoin :
 *   import "@/lib/gsap";
 *
 * Note : SplitText et DrawSVGPlugin sont gratuits depuis GSAP 3.13+.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin };
