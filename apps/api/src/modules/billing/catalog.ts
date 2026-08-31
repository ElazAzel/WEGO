import { itemCatalog, getCatalogItem } from "@wego/domain";

export const catalog = itemCatalog;

export function catalogItem(itemId: string) {
  return getCatalogItem(itemId);
}
