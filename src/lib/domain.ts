import { type Language, type Partner, demoPartners } from "./data";
export type Profile = {
  name: string;
  known: Language[];
  target: Language;
  level: string;
  slot: string;
  goal: number;
  bio: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
};
export type Activity = {
  id: string;
  day: string;
  type: "checkin" | "miss" | "match" | "release";
  text: string;
};
export type State = {
  version: 1;
  profile: Profile;
  onboarded: boolean;
  streak: number;
  completed: number;
  misses: number;
  cooldownUntil: string | null;
  partner: Partner | null;
  lastCheckin: string | null;
  lastEvaluated: string;
  demoOffset: number;
  activities: Activity[];
  histories: Partial<Record<Language, Message[]>>;
  bookmarks: string[];
  peerMessages: Message[];
  results: {
    language: Language;
    level: string;
    score: number;
    total: number;
    day: string;
  }[];
};
export function dayAt(offset = 0, now = Date.now()) {
  return new Date(now + offset * 86400000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}
export const reliability = (completed: number, misses: number) =>
  completed + misses === 0
    ? 100
    : Math.round((100 * completed) / (completed + misses));
export function initialState(): State {
  return {
    version: 1,
    profile: {
      name: "Prajwal",
      known: ["Hindi", "English"],
      target: "Kannada",
      level: "Beginner",
      slot: "Evening",
      goal: 15,
      bio: "Learning through everyday conversations.",
    },
    onboarded: false,
    streak: 0,
    completed: 0,
    misses: 0,
    cooldownUntil: null,
    partner: null,
    lastCheckin: null,
    lastEvaluated: dayAt(),
    demoOffset: 0,
    activities: [],
    histories: {},
    bookmarks: [],
    peerMessages: [],
    results: [],
  };
}
export function sampleState(): State {
  const s = initialState();
  return {
    ...s,
    onboarded: true,
    streak: 6,
    completed: 14,
    misses: 1,
    partner: demoPartners[0],
    activities: [
      {
        id: "sample",
        day: dayAt(),
        type: "match",
        text: "Sample journey: paired with Ananya for Kannada ↔ Hindi.",
      },
    ],
  };
}
export function compatible(
  profile: Profile,
  candidates: Partner[],
  completed: number,
  misses: number,
  now = Date.now(),
) {
  return candidates
    .filter(
      (p) =>
        p.known.includes(profile.target) &&
        profile.known.includes(p.target) &&
        (!p.cooldownUntil || Date.parse(p.cooldownUntil) <= now),
    )
    .map((p) => ({
      ...p,
      fit: Math.max(
        0,
        100 -
          Math.abs(
            reliability(completed, misses) - reliability(p.completed, p.misses),
          ),
      ),
      sameSlot: p.slot === profile.slot,
    }))
    .sort(
      (a, b) =>
        b.fit + Number(b.sameSlot) * 10 - (a.fit + Number(a.sameSlot) * 10),
    );
}
export function inCooldown(
  state: Pick<State, "cooldownUntil" | "demoOffset">,
  now = Date.now(),
) {
  return (
    !!state.cooldownUntil &&
    Date.parse(state.cooldownUntil) > now + state.demoOffset * 86400000
  );
}
export function checkIn(state: State, now = Date.now()): State {
  const day = dayAt(state.demoOffset, now);
  if (state.lastCheckin === day || inCooldown(state, now)) return state;
  return {
    ...state,
    streak: state.streak + 1,
    completed: state.completed + 1,
    lastCheckin: day,
    lastEvaluated: day,
    activities: [
      {
        id: crypto.randomUUID(),
        day,
        type: "checkin" as const,
        text: `Completed ${state.profile.goal} minutes of ${state.profile.target} practice.`,
      },
      ...state.activities,
    ].slice(0, 30),
  };
}
export function applyMiss(state: State, day: string, now = Date.now()): State {
  const misses = state.misses + 1;
  const released = misses >= 3;
  return {
    ...state,
    streak: 0,
    misses,
    cooldownUntil:
      misses >= 2
        ? new Date(now + state.demoOffset * 86400000 + 86400000).toISOString()
        : null,
    partner: released ? null : state.partner,
    peerMessages: released ? [] : state.peerMessages,
    lastEvaluated: day,
    activities: [
      {
        id: crypto.randomUUID(),
        day,
        type: "miss" as const,
        text:
          misses === 1
            ? "First missed day: a warning. Start fresh tomorrow."
            : released
              ? "Repeated missed days: partnership released. Rematch after the 24-hour cooldown."
              : "Second missed day: a 24-hour cooldown. Learning tools stay available.",
      },
      ...state.activities,
    ].slice(0, 30),
  };
}
export function evaluateMissedDays(state: State, now = Date.now()): State {
  if (!state.onboarded) return state;
  const today = dayAt(state.demoOffset, now);
  if (state.lastEvaluated >= today) return state;
  const cooldownEnd = state.cooldownUntil
    ? dayAt(0, Date.parse(state.cooldownUntil) + 86400000)
    : state.lastEvaluated;
  const start =
    cooldownEnd > state.lastEvaluated ? cooldownEnd : state.lastEvaluated;
  const elapsed = Math.max(
    0,
    Math.floor((Date.parse(today) - Date.parse(start)) / 86400000),
  );
  const missed = Math.max(0, elapsed - (state.lastCheckin === start ? 1 : 0));
  let s = state;
  for (let i = 0; i < Math.min(missed, 3); i++) s = applyMiss(s, today, now);
  if (missed > 3) s = { ...s, misses: s.misses + missed - 3 };
  return { ...s, lastEvaluated: today };
}
export function simulateMiss(state: State, now = Date.now()): State {
  const next = {
    ...state,
    demoOffset: state.demoOffset + 1,
    lastCheckin: null,
  };
  return applyMiss(next, dayAt(next.demoOffset, now), now);
}
export function pair(state: State, partner: Partner): State {
  if (
    inCooldown(state) ||
    !partner.known.includes(state.profile.target) ||
    !state.profile.known.includes(partner.target)
  )
    return state;
  return {
    ...state,
    partner,
    peerMessages: [],
    activities: [
      {
        id: crypto.randomUUID(),
        day: dayAt(state.demoOffset),
        type: "match" as const,
        text: `Paired with ${partner.name}: ${state.profile.target} ↔ ${partner.target}.`,
      },
      ...state.activities,
    ].slice(0, 30),
  };
}
export function isState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const v = value as State;
  return (
    v.version === 1 &&
    !!v.profile &&
    typeof v.profile.name === "string" &&
    Array.isArray(v.profile.known) &&
    typeof v.profile.target === "string" &&
    Array.isArray(v.activities) &&
    Array.isArray(v.results) &&
    Array.isArray(v.bookmarks) &&
    !!v.histories &&
    Array.isArray(v.peerMessages) &&
    typeof v.demoOffset === "number" &&
    typeof v.completed === "number" &&
    typeof v.misses === "number"
  );
}
