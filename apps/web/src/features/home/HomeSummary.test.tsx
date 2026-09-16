// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeSummary } from "./HomeSummary";

describe("HomeSummary", () => {
  it("shows the couple counter and the nearest shared date", () => {
    render(<HomeSummary daysTogether={1250} nextEvent={{ title: "Наша годовщина", dateLabel: "через 11 дней" }} myAnswered partnerAnswered partnerName="Алина" />);

    expect(screen.getByText("1 250")).toBeInTheDocument();
    expect(screen.getByText("Наша годовщина")).toBeInTheDocument();
    expect(screen.getByText("через 11 дней")).toBeInTheDocument();
    expect(screen.getByText("Готово")).toBeInTheDocument();
    expect(screen.getByText("Здесь")).toBeInTheDocument();
    expect(screen.queryByText("желаний")).not.toBeInTheDocument();
  });
});
