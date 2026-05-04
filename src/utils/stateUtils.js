export const createListItem = (name) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name
});

export const createCountryItem = (name) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  status: "pending"
});

export const moveItem = (items, fromId, toId) => {
  if (fromId === toId) return items;
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1) return items;

  const updated = [...items];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);
  return updated;
};

export const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const withTimerRunning = (timer, shouldRun) => {
  if (shouldRun && !timer.running) {
    return {
      ...timer,
      running: true,
      startedAt: Date.now()
    };
  }

  if (!shouldRun && timer.running) {
    const updated = updateTimerState(timer);
    return {
      ...timer,
      running: false,
      startedAt: null,
      remaining: updated.remaining
    };
  }

  return timer;
};

export const updateTimerState = (timer, addMs = 0, now = Date.now()) => {
  if (!timer) return timer;
  let remaining = timer.remaining;

  if (timer.running && timer.startedAt) {
    const elapsed = now - timer.startedAt;
    remaining = Math.max(0, timer.remaining - elapsed);
  }

  remaining = Math.max(0, remaining + addMs);

  return {
    ...timer,
    remaining,
    running: timer.running,
    startedAt: timer.running ? timer.startedAt : null
  };
};
