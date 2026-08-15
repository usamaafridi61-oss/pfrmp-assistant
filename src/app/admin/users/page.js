"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const ROLES = [
  {
    id: "admin",
    label: "Administrator",
    hint: "Users, imports, and full settings",
  },
  {
    id: "editor",
    label: "Editor",
    hint: "Create and update monitoring data",
  },
  {
    id: "viewer",
    label: "Viewer",
    hint: "Read-only access to dashboards",
  },
];

const FILTERS = [{ id: "all", label: "All" }, ...ROLES.map(({ id, label }) => ({ id, label }))];

async function parseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function initials(name, username) {
  const source = String(name || username || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function avatarTone(id) {
  const tones = ["green", "gold", "blue", "rose", "violet", "teal"];
  let hash = 0;
  for (const char of String(id || "")) hash = (hash + char.charCodeAt(0)) % tones.length;
  return tones[hash];
}

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const pick = (set, count) =>
    Array.from({ length: count }, () => set[Math.floor(Math.random() * set.length)]).join("");
  return `${pick(upper, 3)}${pick(lower, 5)}${pick(digits, 3)}${pick(symbols, 2)}`
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function passwordStrength(password, username = "") {
  if (!password) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (username && password.toLowerCase().includes(username.toLowerCase())) score = Math.min(score, 1);
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] };
}

function relativeTime(value) {
  if (!value) return "Never signed in";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
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

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v4M12 17v4M4.9 6.5l2.8 2.8M16.3 14.7l2.8 2.8M3 12h4M17 12h4M4.9 17.5l2.8-2.8M16.3 9.3l2.8-2.8" />
    </svg>
  );
}

export default function AdminUsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    password: "",
    role: "editor",
  });

  const strength = passwordStrength(form.password, form.username);

  async function loadUsers() {
    const res = await fetch("/api/auth/users", { cache: "no-store" });
    const data = await parseJson(res);
    if (!res.ok) {
      setError(data.error || "Could not load users.");
      return;
    }
    setUsers(data.users || []);
  }

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/users", { cache: "no-store" });
        const data = await parseJson(res);
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load users.");
          return;
        }
        setUsers(data.users || []);
      } catch {
        if (!cancelled) setError("Could not load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const stats = useMemo(() => {
    const active = users.filter((user) => !user.disabled).length;
    return {
      total: users.length,
      active,
      admins: users.filter((user) => user.role === "admin").length,
      editors: users.filter((user) => user.role === "editor").length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!needle) return true;
      return `${user.displayName} ${user.username}`.toLowerCase().includes(needle);
    });
  }, [users, query, roleFilter]);

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCreated(null);
    setCreating(true);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        setError(data.error || "Could not create user.");
        return;
      }
      setCreated({ username: data.user.username, password: form.password });
      setForm({ displayName: "", username: "", password: "", role: "editor" });
      setShowPassword(false);
      setMessage(`Created ${data.user.username}. Share the password with them privately.`);
      await loadUsers();
    } catch {
      setError("Could not create user.");
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(id, body) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        setError(data.error || "Could not update user.");
        return;
      }
      setConfirmId("");
      await loadUsers();
    } catch {
      setError("Could not update user.");
    } finally {
      setBusyId("");
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied to clipboard.");
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  if (!isAdmin) {
    return (
      <main className="container">
        <h1>Users</h1>
        <p className="sub">Administrator access is required.</p>
      </main>
    );
  }

  return (
    <main className="container users-admin">
      <div className="page-header-banner">
        <div>
          <p className="users-kicker">Access control</p>
          <h1>User accounts</h1>
          <p className="sub">Create people, assign a role, and enable or pause access without leaving this page.</p>
        </div>
      </div>

      <div className="users-stat-row">
        <article className="users-stat">
          <span>Total accounts</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="users-stat">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </article>
        <article className="users-stat">
          <span>Administrators</span>
          <strong>{stats.admins}</strong>
        </article>
        <article className="users-stat">
          <span>Editors</span>
          <strong>{stats.editors}</strong>
        </article>
      </div>

      <div className="users-admin-layout">
        <section className="card users-create-card">
          <div className="users-card-head">
            <h2>New account</h2>
            <p className="sub">They will sign in with this username and temporary password.</p>
          </div>
          <form onSubmit={createUser} className="users-create-form">
            <label>
              Full name
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Ayesha Khan"
                required
              />
            </label>
            <label>
              Username
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. ayesha.khan"
                autoComplete="off"
                required
              />
            </label>
            <label className="users-password-label">
              Temporary password
              <div className="users-password-row">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="users-icon-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </label>
            <div className="users-password-tools">
              <div className={`users-strength users-strength-${strength.score}`}>
                <span />
                <span />
                <span />
                <span />
                <em>{strength.label}</em>
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setForm({ ...form, password: generatePassword() })}>
                <SparkIcon /> Generate
              </button>
            </div>

            <p className="users-role-label">Role</p>
            <div className="users-role-grid" role="radiogroup" aria-label="Role">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  role="radio"
                  aria-checked={form.role === role.id}
                  className={`users-role-card ${form.role === role.id ? "is-selected" : ""} role-${role.id}`}
                  onClick={() => setForm({ ...form, role: role.id })}
                >
                  <strong>{role.label}</strong>
                  <span>{role.hint}</span>
                </button>
              ))}
            </div>

            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="form-message">{message}</p> : null}
            {created ? (
              <div className="users-created-note">
                <p>
                  Share <strong>{created.username}</strong> and the temporary password privately.
                </p>
                <button type="button" className="btn-secondary btn-sm" onClick={() => copyText(created.password)}>
                  Copy password
                </button>
              </div>
            ) : null}
            <button type="submit" className="btn-primary users-create-submit" disabled={creating}>
              {creating ? "Creating…" : "Create user"}
            </button>
          </form>
        </section>

        <section className="card users-list-card">
          <div className="users-list-toolbar">
            <div>
              <h2>Accounts</h2>
              <p className="sub">
                {filtered.length} of {users.length} shown
              </p>
            </div>
            <label className="users-search">
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or username"
                aria-label="Search accounts"
              />
            </label>
          </div>

          <div className="users-filter-row">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`users-filter-chip ${roleFilter === filter.id ? "is-active" : ""}`}
                onClick={() => setRoleFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="users-skeleton-list" aria-hidden="true">
              <div className="users-skeleton" />
              <div className="users-skeleton" />
              <div className="users-skeleton" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="users-empty">
              <strong>No accounts match</strong>
              <span>Try another search or role filter.</span>
            </div>
          ) : (
            <ul className="users-card-list">
              {filtered.map((user) => {
                const isYou = user.id === currentUser?.id;
                const confirming = confirmId === user.id;
                return (
                  <li key={user.id} className={`users-person ${user.disabled ? "is-disabled" : ""}`}>
                    <div className={`users-avatar tone-${avatarTone(user.id)}`}>{initials(user.displayName, user.username)}</div>
                    <div className="users-person-main">
                      <div className="users-person-title">
                        <strong>{user.displayName}</strong>
                        {isYou ? <span className="users-you">You</span> : null}
                        <span className={`users-role-pill role-${user.role}`}>{ROLES.find((role) => role.id === user.role)?.label}</span>
                        <span className={`status-badge ${user.disabled ? "status-cancelled" : "status-completed"}`}>
                          {user.disabled ? "Disabled" : "Active"}
                        </span>
                      </div>
                      <p>
                        @{user.username} · Last sign-in {relativeTime(user.lastLoginAt)}
                      </p>
                    </div>
                    <div className="users-person-actions">
                      <label className="users-inline-role">
                        <span className="sr-only">Change role</span>
                        <select
                          value={user.role}
                          disabled={isYou || busyId === user.id}
                          onChange={(e) => patchUser(user.id, { role: e.target.value })}
                        >
                          {ROLES.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {isYou ? null : confirming ? (
                        <div className="users-confirm">
                          <button
                            type="button"
                            className="btn-danger-sm"
                            disabled={busyId === user.id}
                            onClick={() => patchUser(user.id, { disabled: !user.disabled })}
                          >
                            {user.disabled ? "Enable" : "Disable"}
                          </button>
                          <button type="button" className="btn-text-sm" onClick={() => setConfirmId("")}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-text-sm"
                          disabled={busyId === user.id}
                          onClick={() => setConfirmId(user.id)}
                        >
                          {user.disabled ? "Enable" : "Disable"}
                        </button>
                      )}
                    </div>
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
