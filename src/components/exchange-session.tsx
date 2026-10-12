"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Languages,
  Pause,
  Play,
  RefreshCw,
  Timer,
} from "lucide-react";
import { language, type Language } from "@/lib/data";
export default function ExchangeSession({
  learn,
  teach,
  goal,
  onComplete,
}: {
  learn: Language;
  teach: Language;
  goal: number;
  onComplete: () => void;
}) {
  const [base, setBase] = useState(0),
    [started, setStarted] = useState<number | null>(null),
    [elapsed, setElapsed] = useState(0);
  const total = goal * 60,
    half = total / 2,
    teaching = elapsed >= half,
    finished = elapsed >= total,
    l = language(teaching ? teach : learn);
  const remaining = Math.max(0, (teaching ? total : half) - elapsed),
    clock = `${Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  useEffect(() => {
    if (started === null) return;
    const timer = setInterval(() => {
      const next = Math.min(
        total,
        base + Math.floor((Date.now() - started) / 1000),
      );
      setElapsed(next);
      if (next === total) {
        setBase(next);
        setStarted(null);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [started, base, total]);
  function pause() {
    setBase(elapsed);
    setStarted(null);
  }
  return (
    <section className="panel exchange-session">
      <div className="section-heading">
        <div>
          <h2>Your guided exchange</h2>
          <p className="muted text-sm mt-1">
            Two turns. Equal time. A shared win.
          </p>
        </div>
        <Languages size={20} />
      </div>
      <div className="session-turns">
        <div className={!teaching ? "current" : ""}>
          <span>01 · YOU LEARN</span>
          <strong>{learn}</strong>
          <small>{goal / 2} minutes</small>
        </div>
        <ArrowRight size={18} />
        <div className={teaching ? "current" : ""}>
          <span>02 · YOU TEACH</span>
          <strong>{teach}</strong>
          <small>{goal / 2} minutes</small>
        </div>
      </div>
      <div className="session-body">
        <div className="session-clock">
          <Timer size={16} />
          <strong>{finished ? "Done!" : clock}</strong>
          <span>
            {finished
              ? "Both turns complete"
              : `${teaching ? "Teaching" : "Learning"} ${l.id}`}
          </span>
        </div>
        <div className="session-prompt">
          <small>CONVERSATION STARTER</small>
          <p>
            <strong>{l.greeting}</strong> · {l.roman}
          </p>
          <p>
            {l.intro} <span className="muted">— {l.meaning}</span>
          </p>
          <span className="muted text-xs">
            Introduce yourself, ask about their day, then share one useful word.
            Use the exchange chat below.
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {finished ? (
          <button className="btn primary" onClick={onComplete}>
            <CheckCircle2 size={16} />
            Log your practice
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={() =>
              started === null ? setStarted(Date.now()) : pause()
            }
          >
            {started === null ? <Play size={15} /> : <Pause size={15} />}{" "}
            {started === null
              ? elapsed
                ? "Resume session"
                : "Start guided session"
              : "Pause session"}
          </button>
        )}
        <button
          className="btn secondary"
          onClick={() => {
            setStarted(null);
            setBase(0);
            setElapsed(0);
          }}
          disabled={!elapsed && started === null}
        >
          <RefreshCw size={15} />
          Reset timer
        </button>
      </div>
      <p className="text-xs muted mt-3">
        Local practice timer · Agree on a time with your partner. This MVP
        provides text exchange; the timer is not shared between devices.
      </p>
    </section>
  );
}
