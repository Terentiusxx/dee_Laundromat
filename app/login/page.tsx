"use client";

import { useState, type FormEvent } from "react";
import {useRouter} from "next/navigation";
import {send,type Profile} from "../lib/api";
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Mail, LockKeyhole,
  Truck, Store, ShieldCheck,
} from "lucide-react";
import styles from "./login.module.css";

function LaundryMark() {
  return (
    <svg className={styles.brandMark} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M4 15c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 24c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 33c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.12.76-4.59l-7.98-6.2A23.82 23.82 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="19" height="21" viewBox="0 0 24 29" fill="currentColor" aria-hidden="true">
      <path d="M19.6 15.1c0-3.16 2.56-4.63 2.68-4.7-1.44-2.1-3.67-2.38-4.47-2.4-1.9-.2-3.74 1.13-4.72 1.13-.97 0-2.46-1.1-4.05-1.07C6.98 8.1 5.1 9.3 4.05 11.23c-2.07 3.6-.52 8.94 1.48 11.86.98 1.43 2.15 3.03 3.68 2.97 1.48-.06 2.04-.96 3.83-.96 1.78 0 2.3.96 3.86.93 1.61-.03 2.62-1.43 3.59-2.86a11.8 11.8 0 0 0 1.64-3.35 5.3 5.3 0 0 1-2.53-4.72ZM16.6 5.96C17.4 5 17.95 3.68 17.8 2.35c-1.15.05-2.54.78-3.36 1.74-.74.85-1.4 2.2-1.22 3.5 1.28.1 2.57-.65 3.38-1.63Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router=useRouter();const [busy,setBusy]=useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();setMessage('');setBusy(true);
    try{const user=await send<Profile>('/auth/login','POST',{email:email.trim(),password,remember});router.push(user.role==='admin'?'/admin':'/dashboard');}
    catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }

  return (
    <main className={styles.page}>
      <section className={styles.formPanel} aria-label="Sign in">
        <a href="/" className={styles.brand} aria-label="Dee’s Laundromat home">
          <LaundryMark />
          <span className={styles.brandWords}>
            <span className={styles.brandName}>Dee’s Laundromat</span>
            <span className={styles.brandTagline}>GARMENT CARE, REIMAGINED.</span>
          </span>
        </a>

        <div className={styles.formContent}>
          <div className={styles.eyebrow}>WELCOME BACK</div>
          <h1 className={styles.heading}>Log in to your<br />account</h1>
          <p className={styles.intro}>Access your orders, schedule a pickup, manage your addresses and more.</p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={20} strokeWidth={1.8} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setMessage(""); }}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <LockKeyhole size={20} strokeWidth={1.8} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setMessage(""); }}
                  required
                />
                <button
                  className={styles.revealButton}
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div className={styles.optionsRow}>
              <label className={styles.remember}>
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className={styles.textLink}>Forgot your password?</a>
            </div>

            <button type="submit" className={styles.loginButton}>
              {busy?"Signing in…":"Log In"} <ArrowRight size={19} strokeWidth={1.7} aria-hidden="true" />
            </button>
            {message && <p className={styles.status} role="status">{message}</p>}
          </form>

          <div className={styles.divider}><span>or continue with</span></div>
          <div className={styles.socialRow}>
            <button type="button" className={styles.socialButton} disabled title="Google authentication is not configured in this test build">
              <GoogleLogo /> Continue with Google
            </button>
            <button type="button" className={styles.socialButton} disabled title="Apple authentication is not configured in this test build">
              <AppleLogo /> Continue with Apple
            </button>
          </div>
          <p className={styles.registerPrompt}>Don’t have an account? <a href="/register" className={styles.textLink}>Sign up here</a></p>
        </div>
      </section>

      <aside className={styles.visualPanel} aria-label="Garment care at Dee’s Laundromat">
        <div className={styles.visualImage} aria-hidden="true" />
        <a className={styles.backHome} href="/"><ArrowLeft size={18} /> Back to Home</a>
        <div className={styles.visualCopy}>
          <p className={styles.visualEyebrow}>CLEANER DAYS</p>
          <h2>Care for what<br />you wear.</h2>
          <span className={styles.smallRule} aria-hidden="true" />
          <p className={styles.visualDescription}>
            Whether it’s your everyday essentials<br className={styles.desktopOnly} /> or your most delicate pieces, we give<br className={styles.desktopOnly} /> your garments the care they deserve.
          </p>
        </div>
      </aside>
    </main>
  );
}
