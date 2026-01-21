export function getMadridClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const mins = hour * 60 + minute;
  const hhmm = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { hour, minute, mins, hhmm };
}

export function inWindow(mins: number, start: number, end: number) {
  // inclusivo en ambos extremos
  return mins >= start && mins <= end;
}

export function getArcadiaAvailability(now = new Date()) {
  const { mins, hhmm } = getMadridClock(now);

  // Horarios provisionales hardcoded (luego lo pasamos a OpeningHour/SpecialDate)
  const OPEN_START = 7 * 60 + 30; // 07:30
  const OPEN_END = 24 * 60;       // 24:00
  const KITCHEN_START = 8 * 60;   // 08:00
  const KITCHEN_END = 23 * 60 + 20; // 23:20
  const DELIVERY_START = 15 * 60; // 20:00
  const DELIVERY_END = 22 * 60 + 50; // 22:50

  const isOpen = inWindow(mins, OPEN_START, OPEN_END);
  const kitchenOpen = inWindow(mins, KITCHEN_START, KITCHEN_END);
  const deliveryAvailable = inWindow(mins, DELIVERY_START, DELIVERY_END);

  return {
    now: hhmm,
    isOpen,
    kitchenOpen,
    deliveryAvailable,
    windows: {
      open: { start: "07:30", end: "00:00" },
      kitchen: { start: "08:00", end: "23:20" },
      delivery: { start: "20:00", end: "22:50" },
    },
  };
}
