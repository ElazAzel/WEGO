import { type RitualId } from "@wego/domain";
import { BottomSheet, WButton } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const rituals: Array<{ id: RitualId; title: string; description: string; icon: string }> = [
  { id: "tea", title: "Налить чай", description: "Маленькая пауза рядом.", icon: "☕" },
  { id: "blanket", title: "Укрыть пледом", description: "Добавить комнате мягкости.", icon: "⌁" },
  { id: "hug", title: "Обнимашка", description: "Тёплый жест для Вего.", icon: "♡" },
  { id: "dance", title: "Потанцевать", description: "Поднять настроение комнате.", icon: "✳" },
  { id: "snack", title: "Дать перекус", description: "Немного радости и сил.", icon: "◌" },
  { id: "photo", title: "Сделать кадр", description: "Сохранить вечер в памяти.", icon: "▣" },
];

export function RitualSheet() {
  const open = useUiStore((state) => state.sheet === "rituals");
  const close = useUiStore((state) => state.closeSheet);
  const performRitual = useAppStore((state) => state.performRitual);
  return <BottomSheet open={open} onClose={close} title="Маленькие ритуалы">
    <p className="muted-copy">Здесь нет обязанности ухаживать — только жесты, которые хочется сделать.</p>
    <div className="ritual-grid">{rituals.map((ritual) => <button key={ritual.id} type="button" className="ritual-action" onClick={() => { performRitual(ritual.id); close(); }}><span aria-hidden="true">{ritual.icon}</span><strong>{ritual.title}</strong><small>{ritual.description}</small></button>)}</div>
    <WButton variant="ghost" onClick={close}>Вернуться в комнату</WButton>
  </BottomSheet>;
}
