import { useState } from "react";
import { BottomSheet, WButton, WCard } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

export function PlanBoard() {
  const open = useUiStore((state) => state.sheet === "plans");
  const close = useUiStore((state) => state.closeSheet);
  const plans = useAppStore((state) => state.world.plans);
  const addSharedPlan = useAppStore((state) => state.addSharedPlan);
  const completeSharedPlan = useAppStore((state) => state.completeSharedPlan);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return <BottomSheet open={open} onClose={close} title="Наши планы"><p className="muted-copy">План — это обещание комнате. Когда вы его выполняете, он становится общей памятью.</p><div className="plan-create"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, чай на балконе" aria-label="Название плана" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Дата плана" /><WButton size="sm" disabled={!title.trim()} onClick={() => { addSharedPlan(title, date); setTitle(""); }}>Добавить</WButton></div><div className="plan-list">{plans.length === 0 && <WCard tone="paper"><div className="w-serif" style={{ fontSize: 24 }}>Пока тихо</div><p className="muted-copy">Добавьте маленький план, который хочется прожить вместе.</p></WCard>}{plans.map((plan) => <WCard key={plan.id} tone={plan.tone} className="plan-item"><div><small>{plan.date}</small><div className="w-serif">{plan.title}</div><p>{plan.completedBy.length ? "Один шаг уже сделан" : "Ждёт своего момента"}</p></div><WButton size="sm" variant={plan.completedBy.length ? "mint" : "secondary"} disabled={Boolean(plan.completedBy.length)} onClick={() => completeSharedPlan(plan.id)}>{plan.completedBy.length ? "Готово" : "Сделали"}</WButton></WCard>)}</div></BottomSheet>;
}

