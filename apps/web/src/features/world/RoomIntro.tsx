import { WButton } from "@wego/ui";

export function RoomIntro({ onStart }: { onStart: () => void }) {
  return <aside className="room-intro" aria-label="Начало истории">
    <div className="room-intro__eyebrow">Пролог · комната мечты</div>
    <div className="w-serif room-intro__title">Комната, которую можно собрать вместе</div>
    <p>Сначала посмотри, какой она может стать. А потом Вего принесёт свои вещи — и вы начнёте обживать её с нуля.</p>
    <WButton size="md" onClick={onStart}>Вего переезжает к нам →</WButton>
  </aside>;
}
