"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail, LockKeyhole } from "lucide-react";
type Props = {
  configured: boolean;
  busy: boolean;
  passwordAuth: (
    email: string,
    password: string,
    signup: boolean,
  ) => Promise<boolean>;
  magicLink: (email: string) => Promise<unknown>;
};
export default function AuthForm({
  configured,
  busy,
  passwordAuth,
  magicLink,
}: Props) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [signup, setSignup] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (signup && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (await passwordAuth(email.trim(), password, signup)) setPassword("");
  }
  return (
    <form onSubmit={submit} className="auth-form">
      <div className="auth-tabs" aria-label="Account action">
        <button
          type="button"
          className={!signup ? "selected" : ""}
          onClick={() => {
            setSignup(false);
            setError("");
          }}
          aria-pressed={!signup}
        >
          Sign in
        </button>
        <button
          type="button"
          className={signup ? "selected" : ""}
          onClick={() => {
            setSignup(true);
            setError("");
          }}
          aria-pressed={signup}
        >
          Create account
        </button>
      </div>
      <p className="muted text-sm">
        {signup
          ? "Create your learner account, then choose the languages you can share."
          : "Sign in to your real learner profile and partner conversations."}
      </p>
      <label>
        <span className="flex items-center gap-2">
          <Mail size={14} />
          Email address
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          maxLength={254}
          required
        />
      </label>
      <label>
        <span className="flex items-center gap-2">
          <LockKeyhole size={14} />
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : 1}
          maxLength={128}
          required
          placeholder={signup ? "At least 8 characters" : "Your password"}
        />
      </label>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary full" disabled={!configured || busy}>
        {busy ? (
          <Loader2 className="spin" size={16} />
        ) : (
          <ArrowRight size={16} />
        )}{" "}
        {busy
          ? "Connecting…"
          : signup
            ? "Create learner account"
            : "Sign in to fluent.ly"}
      </button>
      <button
        className="text-button centered"
        type="button"
        disabled={!configured || busy || !email.trim()}
        onClick={() => magicLink(email.trim())}
      >
        Prefer a link? Email me a sign-in link
      </button>
      <p className="text-xs muted">
        Email verification may be required for a new account. Your language
        profile is stored separately from your login details.
      </p>
    </form>
  );
}
