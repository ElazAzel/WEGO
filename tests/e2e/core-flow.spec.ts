import { expect, test } from "@playwright/test";

test("creator can complete check-in, guess, reveal and save a story card", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Создать Wego" }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByRole("button", { name: "Начать" }).click();

  await page.getByRole("button", { name: /Локальный preview/ }).click();
  await page.getByRole("button", { name: /Отметиться сегодня/ }).click();
  await page.getByRole("button", { name: /Хорошо/ }).click();
  await page.getByRole("button", { name: /Дальше/ }).click();
  await page.getByRole("button", { name: /Нормально/ }).click();
  await page.getByRole("button", { name: /Дальше/ }).click();
  await page.getByRole("button", { name: /Побыть вместе/ }).click();
  await page.getByRole("button", { name: /Дальше/ }).click();
  await page.getByRole("button", { name: /Отправить/ }).click();

  await expect(page.getByRole("dialog", { name: "Guess" })).toBeVisible();
  await page.getByRole("button", { name: /Спокойно/ }).click();
  await page.getByRole("button", { name: /Сохранить догадку/ }).click();
  await expect(page.getByRole("dialog", { name: "Reveal" })).toBeVisible();
  await page.getByRole("button", { name: /Сохранить в Story/ }).click();
  await expect(page.getByRole("dialog", { name: "Поделиться моментом" })).toBeVisible();
});
