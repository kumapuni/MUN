import { useMemo } from "react";
import ControlApp from "./components/ControlApp.jsx";
import DisplayApp from "./components/DisplayApp.jsx";

const isDisplayMode = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("display") === "1";
};

export default function App() {
  const displayMode = useMemo(() => isDisplayMode(), []);
  return displayMode ? <DisplayApp /> : <ControlApp />;
}
