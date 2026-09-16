// WEGO global state + persistence via localStorage
// Exposes: WegoProvider, useWego, defaultState

const STORAGE_KEY = "wego-mvp-state-v1";

const defaultState = {
  style: "a", // "a" = premium sticker, "b" = cozy japanese
  room: "warm", // "warm" | "morning"
  homeVariant: "v1", // "v1" | "v2"
  revealVariant: "v1", // "v1" | "v2"
  space: {
    name: "Our Wego",
    type: "pair", // pair | friends | family
    stage: "adult", // egg | baby | adult
    character: "Cozy Dreamer",
    daysAlive: 28,
  },
  me: { name: "Ильяс", tone: "coral", avatarLetter: "И" },
  partner: { name: "Аружан", tone: "lilac", avatarLetter: "А" },
  today: {
    myMood: null, // one of MOOD_OPTIONS ids
    myEnergy: null,
    myWant: null,
    myNote: "",
    myGuess: null, // guess of partner mood
    partnerMood: "calm", // pre-seeded partner answer for demo
    partnerEnergy: "low",
    partnerWant: "together",
    partnerGuess: "good", // partner's guess about me
    revealed: false,
  },
  story: [
    {
      id: "m3",
      date: "20 августа",
      type: "evolution",
      title: "Wego стал Cozy Dreamer",
      body: "Вы оба выбрали тёплые вечера, странную еду и мечты о море.",
      tone: "lilac",
    },
    {
      id: "m2",
      date: "18 августа",
      type: "result",
      title: "Кто из нас",
      body: "Оба решили, что Ильяс первым погибнет в зомби-апокалипсисе.",
      tone: "yellow",
    },
    {
      id: "m1",
      date: "16 августа",
      type: "activity",
      title: "Совместный выбор",
      body: "Нашли общий фильм на вечер.",
      tone: "mint",
    },
    {
      id: "m0",
      date: "12 августа",
      type: "note",
      title: "Записка",
      body: "«Спасибо, что просто был рядом».",
      tone: "peach",
    },
  ],
  plannedActivities: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // shallow merge to survive schema additions
    return { ...defaultState, ...parsed, today: { ...defaultState.today, ...(parsed.today || {}) } };
  } catch {
    return defaultState;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

const WegoContext = React.createContext(null);

function WegoProvider({ children }) {
  const [state, setState] = React.useState(loadState);

  React.useEffect(() => {
    saveState(state);
  }, [state]);

  const update = React.useCallback((patch) => {
    setState((s) => (typeof patch === "function" ? patch(s) : { ...s, ...patch }));
  }, []);

  const updateToday = React.useCallback((patch) => {
    setState((s) => ({ ...s, today: { ...s.today, ...patch } }));
  }, []);

  const addStory = React.useCallback((entry) => {
    setState((s) => ({ ...s, story: [entry, ...s.story] }));
  }, []);

  const reset = React.useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const bothAnswered = state.today.myMood && state.today.partnerMood;

  return (
    <WegoContext.Provider value={{ state, update, updateToday, addStory, reset, bothAnswered }}>
      {children}
    </WegoContext.Provider>
  );
}

function useWego() {
  const ctx = React.useContext(WegoContext);
  if (!ctx) throw new Error("useWego must be inside WegoProvider");
  return ctx;
}

// Helper to get current wego asset paths from state.style + stage
function wegoAsset(style, stage) {
  return `assets/wego/style-${style}-${stage}.png`;
}
function roomAsset(room) {
  return room === "morning" ? "assets/rooms/room-soft-morning.png" : "assets/rooms/room-warm-evening.png";
}

Object.assign(window, {
  WegoProvider,
  useWego,
  wegoAsset,
  roomAsset,
  defaultState,
});
