"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABELS = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

function initials(name, username) {
  const source = String(name || username || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function passwordStrength(password) {
  if (!password) return { score: 0, label: "Enter a new password" };
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] };
}

function relativeTime(value) {
  if (!value) return "Unknown";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(value).toLocaleString();
}

function deviceLabel(ua) {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Browser";
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7.5a12.3 12.3 0 0 1-1.7 2.7" />
      <path d="M6.1 6.1C3.8 7.6 2.1 9.7 1 12.5c1.7 4.4 6 7.5 11 7.5 1.6 0 3.1-.3 4.5-.9" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5c-1.7 4.4-6 7.5-11 7.5S2.7 16.9 1 12.5Z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

export default function AccountPage() {
  const { user, isAdmin, refresh } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState("");
  const strength = passwordStrength(nextPassword);
  const match = confirmPassword && nextPassword === confirmPassword;

  async function loadSessions() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      /* keep current list */
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setSessions(data.sessions || []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function changePassword(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setMessage("Password updated. Other sessions were signed out.");
      await refresh();
      await loadSessions();
    } catch {
      setError("Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(sessionId, all = false) {
    const query = all ? "all=1" : `sessionId=${encodeURIComponent(sessionId)}`;
    await fetch(`/api/auth/sessions?${query}`, { method: "DELETE" });
    setConfirmRevoke("");
    await loadSessions();
  }

  return (
    <main className="container account-security">
      <section className="account-hero">
        <div className="account-hero-identity">
          <div className="users-avatar tone-green account-hero-avatar">
            {initials(user?.displayName, user?.username)}
          </div>
          <div>
            <p className="users-kicker">Your profile</p>
            <h1>{user?.displayName || "Account"}</h1>
            <p className="sub">
              @{user?.username} · {ROLE_LABELS[user?.role] || user?.role}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <Link href="/admin/users" className="btn-secondary">
            Manage users
          </Link>
        ) : null}
      </section>

      <div className="account-layout">
        <section className="card">
          <div className="users-card-head">
            <h2>Change password</h2>
            <p className="sub">Use at least 12 characters with a mix of letters, numbers, and symbols.</p>
          </div>
          <form onSubmit={changePassword} className="account-password-form">
            <label className="users-password-label">
              Current password
              <div className="users-password-row">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="users-icon-btn"
                  onClick={() => setShowCurrent((value) => !value)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showCurrent} />
                </button>
              </div>
            </label>
            <label className="users-password-label">
              New password
              <div className="users-password-row">
                <input
                  type={showNext ? "text" : "password"}
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="users-icon-btn"
                  onClick={() => setShowNext((value) => !value)}
                  aria-label={showNext ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showNext} />
                </button>
              </div>
            </label>
            <div className={`users-strength users-strength-${strength.score}`}>
              <span />
              <span />
              <span />
              <span />
              <em>{strength.label}</em>
            </div>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            {confirmPassword ? (
              <p className={match ? "form-message" : "auth-error"}>{match ? "Passwords match." : "Passwords do not match."}</p>
            ) : null}
            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="form-message">{message}</p> : null}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="card-header-row">
            <div>
              <h2>Active sessions</h2>
              <p className="sub">Devices currently signed in to this account.</p>
            </div>
            {sessions.some((session) => !session.current) ? (
              confirmRevoke === "all" ? (
                <div className="users-confirm">
                  <button type="button" className="btn-danger-sm" onClick={() => revoke("", true)}>
                    Sign out others
                  </button>
                  <button type="button" className="btn-text-sm" onClick={() => setConfirmRevoke("")}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmRevoke("all")}>
                  Sign out other devices
                </button>
              )
            ) : null}
          </div>
          {sessions.length === 0 ? (
            <div className="users-empty">
              <strong>No sessions loaded</strong>
              <span>Refresh the page if this stays empty.</span>
            </div>
          ) : (
            <ul className="account-session-list">
              {sessions.map((session) => {
                const device = deviceLabel(session.userAgent);
                const isComputer = /Mac|Windows|Linux/.test(device);
                return (
                <li key={session.id} className="account-session">
                  <div className="account-session-icon" aria-hidden="true">
                    {isComputer ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="12" rx="2" />
                        <path d="M8 20h8M12 16v4" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="7" y="2" width="10" height="20" rx="2" />
                        <path d="M11 18h2" />
                      </svg>
                    )}
                  </div>
                  <div className="account-session-main">
                    <strong>
                      {device}
                      {session.current ? <span className="status-badge status-completed">This device</span> : null}
                    </strong>
                    <p>
                      {session.ip} · Last seen {relativeTime(session.lastSeenAt)}
                    </p>
                    <p className="muted small">Started {new Date(session.createdAt).toLocaleString()}</p>
                  </div>
                  {session.current ? null : confirmRevoke === session.id ? (
                    <div className="users-confirm">
                      <button type="button" className="btn-danger-sm" onClick={() => revoke(session.id)}>
                        Revoke
                      </button>
                      <button type="button" className="btn-text-sm" onClick={() => setConfirmRevoke("")}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn-text-sm" onClick={() => setConfirmRevoke(session.id)}>
                      Revoke
                    </button>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
