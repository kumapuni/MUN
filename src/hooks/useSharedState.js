export const defaultState = {
  currentView: "title",
  titleText: "Model United Nations",
  agendaText: "議題を入力してください",
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

export const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    return { ...defaultState, ...JSON.parse(stored) };
  } catch {
    return defaultState;
  }
};

export const useSharedState = (isController) => {
  const [state, setState] = React.useState(loadState);

  React.useEffect(() => {
    const channel = new BroadcastChannel("mun-channel");
    const handleMessage = (event) => {
      if (event.data?.type === "state") {
        setState(event.data.state);
      }
    };
    channel.addEventListener("message", handleMessage);

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState({ ...defaultState, ...JSON.parse(event.newValue) });
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const channel = new BroadcastChannel("mun-channel");
    channel.postMessage({ type: "state", state });
    channel.close();
  }, [state, isController]);

  return [state, setState];
};
