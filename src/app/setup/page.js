"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/context/AuthContext";

export default function SetupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [hosted, setHosted] = useState(false);
  const [statusReady, setStatusReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.setupRequired) setBlocked(true);
        if (data.hosted) setHosted(true);
      })
      .catch(() => {})
      .finally(() => setStatusReady(true));
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create administrator.");
        return;
      }
      await refresh();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not complete setup.");
    } finally {
      setBusy(false);
    }
  }

  if (!statusReady) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <p className="sub">Checking setup…</p>
        </div>
      </main>
    );
  }

  if (blocked) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <h2>Setup already complete</h2>
          <p className="sub">An administrator account exists. Sign in to continue.</p>
          <a className="btn-primary auth-submit" href="/login">
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  if (hosted) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-crest">
              <BrandMark />
            </span>
            <div>
              <p className="auth-kicker">Vercel deployment</p>
              <h1>Sign-in credentials</h1>
            </div>
          </div>
          <p className="sub">
            Accounts created on your laptop are not copied to Vercel. Add these environment
            variables in the Vercel project, then redeploy. The site will open the login page.
          </p>
          <ol className="auth-steps">
            <li>
              Open Vercel → Project → <strong>Settings → Environment Variables</strong>
            </li>
            <li>
              Add <code>AUTH_ADMIN_USERNAME</code> and <code>AUTH_ADMIN_PASSWORD</code> using the
              administrator you already created locally
            </li>
            <li>
              Add <code>AUTH_SECRET</code> (32+ random characters) and keep it the same on every
              deploy
            </li>
            <li>Redeploy the project, then sign in</li>
          </ol>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-crest">
            <BrandMark />
          </span>
          <div>
            <p className="auth-kicker">First-run security</p>
            <h1>Create administrator</h1>
          </div>
        </div>
        <p className="sub">
          This account owns the PFRMP data store. Use a long unique password. Username and password
          are enough to sign in.
        </p>
        <form onSubmit={onSubmit}>
          <label>
            Full name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <p className="muted small">
            At least 12 characters, mixing uppercase, lowercase, numbers, and symbols.
          </p>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" className="btn-primary auth-submit" disabled={busy}>
            {busy ? "Creating account…" : "Create administrator"}
          </button>
        </form>
      </div>
    </main>
  );
}
