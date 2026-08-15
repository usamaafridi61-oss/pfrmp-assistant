"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function AuthenticatorWizard() {
  const { user, refresh } = useAuth();
  const searchParams = useSearchParams();
  const fromSetup = searchParams.get("setup") === "1";

  const [step, setStep] = useState("intro");
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const view = user?.totpEnabled && step !== "recovery" ? "enabled" : step;

  async function startSetup() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/totp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start authenticator setup.");
        return;
      }
      setSetup(data);
      setStep("scan");
    } catch {
      setError("Could not start authenticator setup.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupId: setup.setupId, totp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not enable authenticator.");
        return;
      }
      setRecoveryCodes(data.recoveryCodes || []);
      setStep("recovery");
      await refresh();
    } catch {
      setError("Could not enable authenticator.");
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/totp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not disable authenticator.");
        return;
      }
      setCode("");
      setSetup(null);
      setStep("intro");
      await refresh();
    } catch {
      setError("Could not disable authenticator.");
    } finally {
      setBusy(false);
    }
  }

  function copyRecovery() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
  }

  return (
    <main className="container">
      <div className="page-header-banner">
        <div>
          <h1>Authenticator</h1>
          <p className="sub">
            {fromSetup
              ? "Administrator created. Enroll a TOTP authenticator so this account cannot be used with a password alone."
              : "Protect sign-in with a rotating 6-digit code from Google Authenticator, Authy, Microsoft Authenticator, or 1Password."}
          </p>
        </div>
        <Link href="/account" className="btn-secondary">
          Back to account
        </Link>
      </div>

      {view === "enabled" && (
        <section className="card auth-panel">
          <p className="status-badge status-completed">Authenticator enabled</p>
          <h2>Two-factor protection is on</h2>
          <p className="sub">
            Sign-in now requires your password and a code from your authenticator app. Keep recovery
            codes offline.
          </p>
          <form onSubmit={disableTotp} className="auth-inline-form">
            <label>
              Current authenticator code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                className="auth-otp-input"
                placeholder="000000"
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="btn-secondary" disabled={busy}>
              {busy ? "Disabling…" : "Disable authenticator"}
            </button>
          </form>
        </section>
      )}

      {view === "intro" && (
        <section className="card auth-panel">
          <h2>Enroll this account</h2>
          <ol className="auth-steps">
            <li>Install an authenticator app on your phone.</li>
            <li>Scan the QR code generated for this PFRMP account.</li>
            <li>Enter the current 6-digit code to confirm.</li>
            <li>Store the one-time recovery codes in a safe place.</li>
          </ol>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="button" className="btn-primary" onClick={startSetup} disabled={busy}>
            {busy ? "Generating secret…" : "Generate authenticator QR"}
          </button>
        </section>
      )}

      {view === "scan" && setup && (
        <section className="card auth-panel">
          <h2>Scan with your authenticator app</h2>
          <div className="auth-qr-layout">
            {/* QR is a generated data URL, not a remote asset */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrDataUrl} alt="Authenticator QR code" className="auth-qr" />
            <div>
              <p className="sub">If you cannot scan, enter this key manually:</p>
              <code className="auth-secret">{setup.secret}</code>
              <form onSubmit={confirmCode}>
                <label>
                  6-digit code
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="auth-otp-input"
                    placeholder="000000"
                    required
                  />
                </label>
                {error ? <p className="auth-error">{error}</p> : null}
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Verifying…" : "Enable authenticator"}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {view === "recovery" && (
        <section className="card auth-panel">
          <p className="status-badge status-completed">Authenticator enabled</p>
          <h2>Save your recovery codes</h2>
          <p className="sub">
            Each code can be used once if you lose your phone. They will not be shown again.
          </p>
          <ul className="auth-recovery-list">
            {recoveryCodes.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
          <div className="form-actions-row">
            <button type="button" className="btn-secondary" onClick={copyRecovery}>
              {copied ? "Copied" : "Copy codes"}
            </button>
            <Link href="/" className="btn-primary">
              Continue to dashboard
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

export default function AuthenticatorPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p className="sub">Loading authenticator…</p>
        </main>
      }
    >
      <AuthenticatorWizard />
    </Suspense>
  );
}
