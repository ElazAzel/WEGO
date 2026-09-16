import { expect, test } from "@playwright/test";

test("creator can complete the five onboarding steps locally", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Создать Wego" }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await expect(page.getByText("Пригласите")).toBeVisible();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByText("Ваш Wego")).toBeVisible();
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page).toHaveURL(/\/wego$/);
  await expect(page.getByRole("button", { name: /Отметиться сегодня/ })).toBeVisible();
});
