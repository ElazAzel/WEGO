import type { CatalogItem } from "@wego/domain";

export type RegionTier = "A" | "B" | "C" | "D";

const multipliers: Record<RegionTier, number> = { A: 1, B: 0.7, C: 0.5, D: 0.3 };

export function resolveRegionTier(languageCode?: string): RegionTier {
  const language = languageCode?.toLowerCase().split(/[-_]/)[0];
  if (language === "kk" || language === "ky" || language === "uz" || language === "tg" || language === "tk") return "C";
  if (language === "ru" || language === "tr" || language === "az") return "B";
  return "A";
}

export function resolveStarsPrice(item: CatalogItem, tier: RegionTier): number | null {
  if (!item.starsPrice) return null;
  return Math.max(1, Math.round(item.starsPrice * multipliers[tier]));
}
