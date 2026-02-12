import { createEffect, createSignal, onCleanup } from "solid-js";

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

export const createCurrentDate = () => {
  const [date, setDate] = createSignal(getTodayDateString());

  createEffect(() => {
    // oxlint-disable-next-line init-declarations
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextUpdate = () => {
      const msUntilMidnight = getMsUntilMidnight();
      // Add a small buffer (100ms) to ensure we're past midnight
      timeoutId = setTimeout(() => {
        setDate(getTodayDateString());
        scheduleNextUpdate();
      }, msUntilMidnight + 100);
    };

    scheduleNextUpdate();

    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });

  return date;
};
