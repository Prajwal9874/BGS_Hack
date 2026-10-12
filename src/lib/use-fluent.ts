"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { demoPartners, type Partner, type Language } from "./data";
import {
  initialState,
  sampleState,
  isState,
  evaluateMissedDays,
  checkIn,
  simulateMiss,
  pair,
  dayAt,
  inCooldown,
  type State,
  type Profile,
  type Message,
} from "./domain";
import type { Session } from "@supabase/supabase-js";
const STORAGE = "fluent.ly.demo.v1";
function fromRow(p: Record<string, unknown>): Partner {
  return {
    id: String(p.id),
    name: String(p.name),
    known: p.known as Language[],
    proficiency: p.proficiency as Profile["proficiency"],
    target: p.target as Language,
    level: String(p.level),
    slot: String(p.slot),
    bio: String(p.bio),
    streak: Number(p.streak),
    completed: Number(p.completed),
    misses: Number(p.misses),
    cooldownUntil: p.cooldown_until as string | null,
    interests: ["Language exchange"],
  };
}
export function useFluent() {
  const [state, setState] = useState<State>(initialState),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<"demo" | "live">("demo"),
    [session, setSession] = useState<Session | null>(null),
    [partners, setPartners] = useState<Partner[]>(demoPartners),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [syncStatus, setSyncStatus] = useState("Local demo");
  const current = useRef(state);
  current.current = state;
  const currentMode = useRef(mode);
  currentMode.current = mode;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isState(parsed)) setState(evaluateMissedDays(parsed));
        else setNotice("Saved demo was incompatible; started a fresh journey.");
      }
    } catch {
      setNotice(
        "Browser storage is unavailable; changes may not survive a refresh.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || mode !== "demo") return;
    const timer = setInterval(
      () => setState((s) => evaluateMissedDays(s)),
      60000,
    );
    return () => clearInterval(timer);
  }, [ready, mode]);
  useEffect(() => {
    if (ready && mode === "demo") {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(state));
      } catch {
        setNotice("Unable to save to browser storage.");
      }
    }
  }, [state, ready, mode]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (
        data.session &&
        localStorage.getItem("fluent.ly.mode.v1") !== "demo"
      ) {
        setState(initialState());
        setMode("live");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  const liveRequest = useRef(0);
  const loadLive = useCallback(async () => {
    const requestId = ++liveRequest.current;
    if (!supabase || !session || currentMode.current !== "live") return;
    const refresh = await supabase.rpc("refresh_accountability");
    if (refresh.error) throw new Error(refresh.error.message);
    const [pr, lr] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("learning_state")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle(),
    ]);
    if (pr.error) throw new Error(pr.error.message);
    if (lr.error) throw new Error(lr.error.message);
    const rows = pr.data ?? [],
      own = rows.find((p) => p.id === session.user.id);
    setPartners(
      rows
        .filter((p) => p.id !== session.user.id && !p.partner_id)
        .map(fromRow),
    );
    if (!own) {
      setState({
        ...initialState(),
        profile: {
          ...initialState().profile,
          name: session.user.user_metadata?.display_name ?? "",
        },
      });
      setSyncStatus("Connected · create your profile");
      return;
    }
    const partnerRow = rows.find((p) => p.id === own.partner_id);
    const notes = lr.data?.data ?? {};
    const s: State = {
      ...initialState(),
      profile: {
        name: own.name,
        known: own.known,
        proficiency: own.proficiency ?? {},
        target: own.target,
        level: own.level,
        slot: own.slot,
        goal: own.goal,
        bio: own.bio,
      },
      onboarded: true,
      streak: own.streak,
      completed: own.completed,
      misses: own.misses,
      cooldownUntil: own.cooldown_until,
      partner: partnerRow ? fromRow(partnerRow) : null,
      lastCheckin: own.last_checkin,
      lastEvaluated: own.last_evaluated,
      histories: notes.histories ?? {},
      bookmarks: notes.bookmarks ?? [],
      results: notes.results ?? [],
      activities: notes.activities ?? [],
      peerMessages: [],
    };
    if (partnerRow) {
      const mr = await supabase
        .from("peer_messages")
        .select("*")
        .or(
          `sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`,
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (mr.error) throw new Error(mr.error.message);
      s.peerMessages = (mr.data ?? [])
        .reverse()
        .filter(
          (m) =>
            (m.sender_id === session.user.id &&
              m.recipient_id === partnerRow.id) ||
            (m.sender_id === partnerRow.id &&
              m.recipient_id === session.user.id),
        )
        .map((m) => ({
          id: m.id,
          role: m.sender_id === session.user.id ? "user" : "assistant",
          content: m.content,
        }));
    }
    if (currentMode.current === "live" && requestId === liveRequest.current) {
      setState(s);
      setSyncStatus("Connected · Supabase");
    }
  }, [session]);
  useEffect(() => {
    if (mode !== "live" || !session || !supabase) return;
    let active = true;
    loadLive().catch((e) => {
      if (active) {
        setNotice(
          `Cloud connection failed: ${e.message}. Demo remains available.`,
        );
        setSyncStatus("Connection error");
      }
    });
    const channel = supabase
      .channel(`fluent-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          loadLive().catch((e) => setNotice(e.message));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "peer_messages",
          filter: `recipient_id=eq.${session.user.id}`,
        },
        () => {
          loadLive().catch((e) => setNotice(e.message));
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR")
          setSyncStatus("Realtime unavailable · refresh to sync");
      });
    return () => {
      active = false;
      supabase?.removeChannel(channel);
    };
  }, [mode, session, loadLive]);
  async function action(task: () => Promise<void>) {
    if (busy) return false;
    setBusy(true);
    try {
      await task();
      return true;
    } catch (e) {
      setNotice(
        e && typeof e === "object" && "message" in e
          ? String(e.message)
          : "Something went wrong. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function updateNotes(next: State) {
    if (mode === "live" && session && supabase) {
      const { error } = await supabase.from("learning_state").upsert({
        user_id: session.user.id,
        data: {
          histories: next.histories,
          bookmarks: next.bookmarks,
          results: next.results,
          activities: next.activities,
        },
      });
      if (error) {
        setNotice(`Not saved to cloud: ${error.message}`);
        throw error;
      }
    }
    setState(next);
  }
  async function saveProfile(profile: Profile) {
    return await action(async () => {
      if (mode === "live" && session && supabase) {
        const { error } = await supabase.rpc("save_profile", {
          p_name: profile.name,
          p_known: profile.known,
          p_target: profile.target,
          p_level: profile.level,
          p_slot: profile.slot,
          p_goal: profile.goal,
          p_bio: profile.bio,
          p_proficiency: Object.fromEntries(
            profile.known.map((id) => [
              id,
              profile.proficiency?.[id] ?? "Fluent",
            ]),
          ),
        });
        if (error) throw error;
        await loadLive();
      } else {
        const s = current.current;
        const changed =
          s.profile.target !== profile.target ||
          s.profile.known.join() !== profile.known.join();
        setState({
          ...s,
          profile,
          onboarded: true,
          lastEvaluated: dayAt(s.demoOffset),
          partner: changed ? null : s.partner,
          peerMessages: changed ? [] : s.peerMessages,
        });
      }
      setNotice("Your learning profile is ready. Let’s find your people.");
    });
  }
  async function connect(p: Partner) {
    await action(async () => {
      if (mode === "live" && supabase) {
        const { error } = await supabase.rpc("pair_partner", {
          other_id: p.id,
        });
        if (error) throw error;
        await loadLive();
      } else setState((s) => pair(s, p));
      setNotice(`Your loop with ${p.name} is ready.`);
    });
  }
  async function checkin() {
    return await action(async () => {
      if (mode === "live" && supabase) {
        const { error } = await supabase.rpc("daily_checkin");
        if (error) throw error;
        await loadLive();
      } else {
        const evaluated = evaluateMissedDays(current.current);
        if (inCooldown(evaluated)) {
          setState(evaluated);
          throw new Error(
            "Check-ins are paused during your cooldown. Tutors and resources stay available.",
          );
        }
        setState(checkIn(evaluated));
      }
      setNotice("Practice logged. Keep the loop going!");
    });
  }
  async function release() {
    await action(async () => {
      if (mode === "live" && supabase) {
        const { error } = await supabase.rpc("release_partner");
        if (error) throw error;
        await loadLive();
      } else setState((s) => ({ ...s, partner: null, peerMessages: [] }));
      setNotice("Partnership released. You can find a new reciprocal match.");
    });
  }
  async function sendPeer(content: string) {
    return await action(async () => {
      const s = current.current;
      if (!s.partner) return;
      if (mode === "live" && session && supabase) {
        const { error } = await supabase.from("peer_messages").insert({
          sender_id: session.user.id,
          recipient_id: s.partner.id,
          content,
        });
        if (error) throw error;
        await loadLive();
      } else {
        setState({
          ...s,
          peerMessages: [
            ...s.peerMessages,
            { id: crypto.randomUUID(), role: "user", content },
            {
              id: crypto.randomUUID(),
              role: "assistant",
              source: "demo",
              content: `Simulated partner reply: Let’s practice ${s.profile.target} and ${s.partner.target} for ${s.profile.goal} minutes. Start by introducing yourself!`,
            },
          ],
        });
      }
    });
  }
  async function tutor(id: Language, text: string) {
    const history = [
      ...(current.current.histories[id] ?? []),
      { id: crypto.randomUUID(), role: "user" as const, content: text },
    ];
    await updateNotes({
      ...current.current,
      histories: { ...current.current.histories, [id]: history },
    });
    const response = await fetch("/api/tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(mode === "live" && session
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({
        language: id,
        messages: history
          .slice(-20)
          .map((m) => ({ ...m, content: m.content.slice(0, 1500) })),
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Tutor unavailable.");
    const reply: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.reply,
      source: data.source,
    };
    await updateNotes({
      ...current.current,
      histories: { ...current.current.histories, [id]: [...history, reply] },
    });
    return data.notice as string;
  }
  function resetDemo(sample = false) {
    localStorage.setItem("fluent.ly.mode.v1", "demo");
    setMode("demo");
    setPartners(demoPartners);
    setState(sample ? sampleState() : initialState());
    setSyncStatus("Local demo");
    setNotice(
      sample
        ? "Sample journey loaded · all partners and progress are simulated."
        : "Demo reset. Start your new learning journey.",
    );
  }
  async function passwordAuth(
    email: string,
    password: string,
    signup: boolean,
  ) {
    return action(async () => {
      if (!supabase) throw new Error("Supabase is not configured.");
      const result = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (result.data.session) {
        setSession(result.data.session);
        setState(initialState());
        setMode("live");
        localStorage.setItem("fluent.ly.mode.v1", "live");
        setNotice("Signed in. Loading your learner profile…");
      } else
        setNotice(
          "Account created. Check your email to verify it, then sign in.",
        );
    });
  }
  async function signIn(email: string) {
    await action(async () => {
      if (!supabase)
        throw new Error(
          "Add Supabase credentials to .env.local to enable email sign-in.",
        );
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setNotice(
        "Check your email for the sign-in link, then choose Live account.",
      );
    });
  }
  return {
    state,
    ready,
    mode,
    session,
    partners,
    busy,
    notice,
    setNotice,
    syncStatus,
    configured: !!supabase,
    saveProfile,
    connect,
    checkin,
    release,
    sendPeer,
    tutor,
    updateNotes,
    resetDemo,
    signIn,
    passwordAuth,
    switchLive: () => {
      if (session) {
        localStorage.setItem("fluent.ly.mode.v1", "live");
        setMode("live");
        setState(initialState());
        setNotice("Loading your live account…");
      } else setNotice("Sign in first to open your live account.");
    },
    refresh: () => action(loadLive),
    signOut: () =>
      action(async () => {
        await supabase?.auth.signOut();
        resetDemo();
      }),
    miss: () => {
      if (mode === "demo") {
        const next = simulateMiss(current.current);
        setState(next);
        setNotice(next.activities[0].text);
      }
    },
    advance: () => {
      if (mode === "demo") {
        setState((s) => ({
          ...s,
          demoOffset: s.demoOffset + 1,
          lastEvaluated: dayAt(s.demoOffset + 1),
        }));
        setNotice(
          "Demo clock advanced 24 hours. Matching reopens when the cooldown expires.",
        );
      }
    },
  };
}
