export type PetIntent = "greeting" | "care" | "game" | "support" | "thanks" | "plans" | "memories" | "return" | "rest" | "celebration" | "unknown";
export type PetReplyContext = { intent: PetIntent; mood: "sleepy" | "cozy" | "curious" | "playful" | "loved"; energy: number; recentReplyIds: string[] };
type Reply = { id: string; intents: PetIntent[]; text: string; mood?: PetReplyContext["mood"]; minEnergy?: number };
const replies: Reply[] = [
  { id: "hello-1", intents: ["greeting", "return"], text: "Вы вернулись. Я оставил для вас немного уюта.", mood: "cozy" },
  { id: "care-1", intents: ["care"], text: "Мне хорошо, когда вы заботитесь обо мне. И друг о друге тоже.", mood: "loved" },
  { id: "care-2", intents: ["care"], text: "Погладь меня ещё раз — я запомню этот тёплый момент.", mood: "loved" },
  { id: "game-1", intents: ["game"], text: "Давайте сыграем. Я уже приготовил три карточки.", mood: "playful" },
  { id: "support-1", intents: ["support"], text: "Можно ничего не решать прямо сейчас. Я посижу рядом.", mood: "cozy" },
  { id: "thanks-1", intents: ["thanks"], text: "Это я должен вас поблагодарить. Записал в память комнаты.", mood: "loved" },
  { id: "plans-1", intents: ["plans"], text: "Покажите ваш план — я помогу выбрать маленький следующий шаг.", mood: "curious" },
  { id: "memory-1", intents: ["memories"], text: "Давайте сохраним этот день. Такие маленькие вещи становятся историей.", mood: "cozy" },
  { id: "rest-1", intents: ["rest"], text: "Тихий вечер тоже считается совместным делом.", mood: "sleepy" },
  { id: "party-1", intents: ["celebration"], text: "Ура! Включаю праздничное настроение для двоих.", mood: "playful" },
  { id: "unknown-1", intents: ["unknown"], text: "Я пока понимаю уход, игры, планы и воспоминания. Выбери тему — и продолжим.", mood: "curious" },
];
export const petMiniGames = [
  { id: "memory-pairs", title: "Найди пары", description: "Откройте карточки и соберите одинаковые воспоминания." },
  { id: "partner-choice", title: "Угадай выбор", description: "Каждый выбирает вариант, ответы открываются одновременно." },
  { id: "shared-activity", title: "Выберите занятие", description: "Питомец предложит три идеи для ближайшего вечера." },
] as const;
const rules: Array<[PetIntent, RegExp]> = [
  ["game", /(игр|поигра|карточ|весел)/i], ["support", /(устал|тяжел|груст|поддерж)/i], ["care", /(поглад|покорм|ухаж|обним|забот)/i], ["plans", /(план|поезд|цель|собир)/i], ["memories", /(памят|воспомин|сохран|фото|альбом)/i], ["celebration", /(ура|празд|поздрав|годовщ)/i], ["thanks", /(спасибо|благодар)/i], ["rest", /(сон|отдых|тихо|спокой)/i], ["return", /(вернул|дома|пришл)/i], ["greeting", /(привет|здравств)/i],
];
export function petIntent(input: string): PetIntent { for (const [intent, pattern] of rules) if (pattern.test(input)) return intent; return "unknown"; }
export function petReply(context: PetReplyContext): Reply {
  const matching = replies.filter(reply => reply.intents.includes(context.intent) && !context.recentReplyIds.includes(reply.id) && (reply.minEnergy ?? 0) <= context.energy);
  const fallback = replies.filter(reply => reply.intents.includes("unknown") && !context.recentReplyIds.includes(reply.id));
  return (matching[0] ?? fallback[0] ?? replies.find(reply => reply.intents.includes("unknown"))!);
}
