"use client";

import { useState, type FormEvent } from "react";
import {useRouter} from "next/navigation";
import {send,type Profile} from "../lib/api";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import styles from "./register.module.css";


function LaundryMark() {
  return (
    <svg className={styles.brandMark} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <path d="M4 15c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 24c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M4 33c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

const countries = [
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+225", name: "Côte d’Ivoire", flag: "🇨🇮" },
];

export default function RegisterPage() {
  const router=useRouter();const [busy,setBusy]=useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setStatus('');
    if(password.length<10){setStatus('Please use at least 10 characters for your password.');return;}
    if(!agreed){setStatus('Accept the Terms and Privacy Policy first.');return;}
    setBusy(true);
    try{await send<Profile>('/auth/register','POST',{name:fullName.trim(),email:email.trim(),phone:`${countryCode} ${phone.trim()}`,password,acceptTerms:agreed});router.push('/dashboard');}
    catch(e){setStatus((e as Error).message);}finally{setBusy(false);}
  }

  function clearStatus() { setStatus(""); }

  return (
    <main className={styles.page}>
      <section className={styles.formPanel} aria-label="Create your account">
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Dee’s Laundromat homepage">
            <LaundryMark />
            <span className={styles.brandWords}>
              <span className={styles.brandName}>Dee’s Laundromat</span>
              <span className={styles.brandTagline}>GARMENT CARE, REIMAGINED.</span>
            </span>
          </Link>
          <p className={styles.headerLogin}>Already have an account? <Link href="/login">Log in</Link></p>
        </header>

        <div className={styles.formContent}>
          <p className={styles.eyebrow}>CREATE YOUR ACCOUNT</p>
          <h1 className={styles.heading}>Join Dee’s Laundromat.</h1>
          <p className={styles.intro}>Create an account to book a pickup, manage your orders, and enjoy a cleaner, easier laundry experience.</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="register-full-name">Full name</label>
              <div className={styles.inputWrap}>
                <UserRound aria-hidden="true" size={21} strokeWidth={1.7} />
                <input
                  id="register-full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(event) => { setFullName(event.target.value); clearStatus(); }}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="register-email">Email address</label>
              <div className={styles.inputWrap}>
                <Mail aria-hidden="true" size={21} strokeWidth={1.7} />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); clearStatus(); }}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="register-phone">Phone number</label>
              <div className={styles.inputWrap}>
                <Phone aria-hidden="true" size={20} strokeWidth={1.7} />
                <select
                  className={styles.countrySelect}
                  aria-label="Country calling code"
                  value={countryCode}
                  onChange={(event) => { setCountryCode(event.target.value); clearStatus(); }}
                >
                  {countries.map(({ code, name, flag }) => (
                    <option key={code} value={code}>{flag} {code} · {name}</option>
                  ))}
                </select>
                <span className={styles.countryDivider} aria-hidden="true" />
                <input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(event) => { setPhone(event.target.value); clearStatus(); }}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="register-password">Password</label>
              <div className={styles.inputWrap}>
                <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.7} />
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); clearStatus(); }}
                  minLength={10}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={1.7} /> : <Eye size={20} strokeWidth={1.7} />}
                </button>
              </div>
            </div>

            <label className={styles.termsRow}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => { setAgreed(event.target.checked); clearStatus(); }}
                required
              />
              <span>
                I agree to the <Link href="/terms" onClick={(e) => e.stopPropagation()}>Terms &amp; Conditions</Link> and{" "}
                <Link href="/privacy" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>.
              </span>
            </label>

            <button type="submit" className={styles.submitButton}>
              {busy?"Creating account…":"Create account"} <ArrowRight size={20} strokeWidth={1.65} aria-hidden="true" />
            </button>
            {status && <p className={styles.status} role="status">{status}</p>}
          </form>

          <p className={styles.mobileLogin}>Already have an account? <Link href="/login">Log in</Link></p>
        </div>
      </section>

      <aside className={styles.visualPanel} aria-label="Fresh garments, expertly cared for">
        <div className={styles.visualImage} aria-hidden="true" />
        <div className={styles.visualCopy}>
          <p className={styles.visualEyebrow}>FRESH BEGINNINGS</p>
          <h2>Care for what<br />you wear.</h2>
          <span className={styles.smallRule} aria-hidden="true" />
          <p>Thoughtful garment care for your everyday<br className={styles.desktopBreak} /> essentials and your most delicate pieces.</p>
        </div>
      </aside>
    </main>
  );
}
