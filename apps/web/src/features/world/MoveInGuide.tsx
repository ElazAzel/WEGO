import type { MoveInStep } from "@wego/domain";
import { WButton } from "@wego/ui";

interface MoveInGuideProps {
  step: MoveInStep;
  onOpenRituals: () => void;
  onPlaceFurniture: () => void;
}

export function MoveInGuide({ step, onOpenRituals, onPlaceFurniture }: MoveInGuideProps) {
  if (step === "welcome" || step === "complete") return null;

  const copy = {
    "meet-wego": { eyebrow: "Шаг 1 из 3", title: "Познакомь Вего с комнатой", body: "Он немного волнуется. Нажми на Вего — так начнётся ваша первая глава." },
    "first-ritual": { eyebrow: "Шаг 2 из 3", title: "Первый вечер", body: "Выберите маленький ритуал, чтобы Вего почувствовал себя дома." },
    "first-furniture": { eyebrow: "Шаг 3 из 3", title: "Сделаем первый уголок", body: "Поставим мягкий коврик? Потом комнату можно будет собирать по-своему." },
  }[step];

  return <aside className="move-in-guide" aria-label="Подсказка переезда">
    <div>
      <div className="move-in-guide__eyebrow">{copy.eyebrow}</div>
      <div className="w-serif move-in-guide__title">{copy.title}</div>
      <p>{copy.body}</p>
    </div>
    {step === "first-ritual" && <WButton size="sm" variant="secondary" onClick={onOpenRituals}>Выбрать ритуал</WButton>}
    {step === "first-furniture" && <WButton size="sm" onClick={onPlaceFurniture}>Поставить коврик</WButton>}
  </aside>;
}
