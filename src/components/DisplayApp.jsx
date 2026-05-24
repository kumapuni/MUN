import { useEffect, useMemo, useRef, useState } from "react";
import DisplayScreen from "./DisplayScreen.jsx";
import { useSharedState } from "../hooks/useSharedState.js";
import { updateTimerState } from "../utils/stateUtils.js";
import { loadFileDataUrl } from "../utils/fileStore.js";

const GAVEL_AUDIO_URL = `${import.meta.env.BASE_URL}gavel.mp3`;

export default function DisplayApp() {
  const [state] = useSharedState(false);
  const [now, setNow] = useState(Date.now());
  const [fileDataUrl, setFileDataUrl] = useState("");
  const audioRef = useRef(null);
  const prevRemainingRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(GAVEL_AUDIO_URL);
  }, []);

  useEffect(() => {
    let active = true;
    if (!state.fileView?.id) {
      setFileDataUrl("");
      return undefined;
    }
    loadFileDataUrl(state.fileView.id)
      .then((dataUrl) => { if (active) setFileDataUrl(dataUrl || ""); })
      .catch(() => { if (active) setFileDataUrl(""); });
    return () => { active = false; };
  }, [state.fileView?.id]);

  const derivedState = useMemo(() => ({
    ...state,
    timer: updateTimerState(state.timer, 0, now),
    fileView: { ...state.fileView, dataUrl: fileDataUrl }
  }), [state, now, fileDataUrl]);

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
