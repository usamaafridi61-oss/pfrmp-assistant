"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const nextPath = safeNext(searchParams.get("next"));

  async function submitCredentials(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("Enter your username and password.");
      setBusy(false);
      return;
    }
    if (trimmedUsername.includes("@")) {
      setError("Sign in with your username, not your email address.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: trimmedUsername, password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        setError("Could not sign in. Try again.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        return;
      }
      if (data.requiresTotp) {
        setChallengeId(data.challengeId);
        return;
      }
      const next = await refresh();
      if (next.status !== "authenticated") {
        setError("Signed in, but the session could not be restored. Try again.");
        return;
      }
      window.location.assign(nextPath);
    } catch {
      setError("Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function submitTotp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          challengeId,
          totp: useRecovery ? undefined : totp,
          recoveryCode: useRecovery ? recoveryCode : undefined,
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        setError("Could not verify the authenticator code.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Authenticator verification failed.");
        return;
      }
      await refresh();
      window.location.assign(nextPath);
    } catch {
      setError("Could not verify the authenticator code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-crest brand-crest-lg">
            <BrandMark size={72} />
          </span>
          <div>
            <h1 className="auth-wordmark">BTASP</h1>
            <p className="auth-kicker">Billion Tree Afforestation Support Project</p>
          </div>
        </div>

        {challengeId ? (
          <>
            <h2>Authenticator</h2>
            <p className="sub">Open your authenticator app and enter the 6-digit code for this account.</p>
            <form onSubmit={submitTotp}>
              {useRecovery ? (
                <label>
                  Recovery code
                  <input
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    autoComplete="one-time-code"
                    placeholder="XXXXX-XXXXX"
                    required
                  />
                </label>
              ) : (
                <label>
                  6-digit code
                  <input
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="auth-otp-input"
                    required
                  />
                </label>
              )}
              {error ? <p className="auth-error">{error}</p> : null}
              <button type="submit" className="btn-primary auth-submit" disabled={busy}>
                {busy ? "Verifying…" : "Verify and continue"}
              </button>
            </form>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setUseRecovery((v) => !v);
                setError("");
              }}
            >
              {useRecovery ? "Use authenticator code" : "Use a recovery code"}
            </button>
          </>
        ) : (
          <>
            <h2>Sign in</h2>
            <p className="sub">Use your username and password. Email addresses will not work.</p>
            <form onSubmit={submitCredentials}>
              <label>
                Username
                <input
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error ? <p className="auth-error">{error}</p> : null}
              <button type="submit" className="btn-primary auth-submit" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        )}

        <p className="auth-foot muted small">
          Sessions expire after inactivity. Sign in with username and password only.
        </p>
      </div>
    </main>
  );
}

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login") || value.startsWith("/setup")) {
    return "/";
  }
  return value;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-screen">
          <div className="auth-card">
            <p className="sub">Loading sign-in…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
