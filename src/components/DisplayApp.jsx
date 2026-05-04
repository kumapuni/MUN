import { useEffect, useMemo, useState } from "react";
import DisplayScreen from "./DisplayScreen.jsx";
import { useSharedState } from "../hooks/useSharedState.js";
import { updateTimerState } from "../utils/stateUtils.js";

export default function DisplayApp() {
  const [state] = useSharedState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const derivedState = useMemo(() => {
    return {
      ...state,
      timer: updateTimerState(state.timer, 0, now)
    };
  }, [state, now]);

  return (
    <div className="display-root">
      <DisplayScreen state={derivedState} />
    </div>
  );
}
