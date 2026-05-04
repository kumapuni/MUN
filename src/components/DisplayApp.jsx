import { useEffect, useMemo, useRef, useState } from "react";
import DisplayScreen from "./DisplayScreen.jsx";
import { useSharedState } from "../hooks/useSharedState.js";
import { updateTimerState } from "../utils/stateUtils.js";

const GAVEL_AUDIO_URL = `${import.meta.env.BASE_URL}gavel.mp3`;

export default function DisplayApp() {
  const [state] = useSharedState(false);
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef(null);
  const prevRemainingRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(GAVEL_AUDIO_URL);
  }, []);

  const derivedState = useMemo(() => {
    return {
      ...state,
      timer: updateTimerState(state.timer, 0, now)
    };
  }, [state, now]);

  useEffect(() => {
    const remaining = derivedState.timer?.remaining ?? 0;
    const prevRemaining = prevRemainingRef.current;

    if (prevRemaining !== null && prevRemaining > 0 && remaining === 0) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }

    prevRemainingRef.current = remaining;
  }, [derivedState.timer?.remaining]);

  return (
    <div className="display-root">
      <DisplayScreen state={derivedState} />
    </div>
  );
}
