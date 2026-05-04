import React from "react";

export const defaultState = {
  currentView: "title",
  titleText: "Model United Nations",
  agendaText: "議題を入力してください",
  timerLabel: "",
  updatedAt: Date.now(),
  timer: {
    duration: 5 * 60 * 1000,
    remaining: 5 * 60 * 1000,
    running: false,
    startedAt: null
  },
  speakers: [],
  attendance: [],
  fileView: {
    name: "",
    type: "",
    dataUrl: ""
  },
  availableViews: [
    { id: "title", label: "タイトル" },
    { id: "agenda", label: "議題" },
    { id: "timer", label: "タイマー" },
    { id: "clock", label: "時計" },
    { id: "speakers", label: "発言リスト" },
    { id: "attendance", label: "出席リスト" },
    { id: "file", label: "資料" }
  ]
};

const STORAGE_KEY = "mun-state";

const normalizeState = (state) => ({
  ...defaultState,
  ...state,
  updatedAt: state?.updatedAt ?? Date.now()
});

export const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    return normalizeState(JSON.parse(stored));
  } catch {
    return defaultState;
  }
};

export const useSharedState = (isController) => {
  const [state, setState] = React.useState(loadState);
  const stateRef = React.useRef(state);
  const syncTimerRef = React.useRef(null);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setSyncedState = React.useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const resolved = next && typeof next === "object" ? next : prev;
      return {
        ...resolved,
        updatedAt: Date.now()
      };
    });
  }, []);

  React.useEffect(() => {
    const channel = new BroadcastChannel("mun-channel");
    const handleMessage = (event) => {
      if (event.data?.type === "state") {
        const incoming = normalizeState(event.data.state);
        setState((prev) => {
          if (incoming.updatedAt <= prev.updatedAt) return prev;
          return incoming;
        });
      }
    };
    channel.addEventListener("message", handleMessage);

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        const incoming = normalizeState(JSON.parse(event.newValue));
        setState((prev) => {
          if (incoming.updatedAt <= prev.updatedAt) return prev;
          return incoming;
        });
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    if (!isController) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      const snapshot = stateRef.current;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      const channel = new BroadcastChannel("mun-channel");
      channel.postMessage({ type: "state", state: snapshot });
      channel.close();
    }, 120);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [state, isController]);

  return [state, setSyncedState];
};
