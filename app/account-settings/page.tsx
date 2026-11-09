"use client";
import {useState,useEffect,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {UserRound,ShieldCheck,SlidersHorizontal,LockKeyhole,Trash2} from 'lucide-react';
import {OrdersShell} from '../my-orders/OrdersShell';
import {api,send,type Profile} from '../lib/api';
import base from '../customer.module.css';
import styles from './settings.module.css';
type Tab='personal'|'security'|'preferences';
export default function AccountSettings(){
 const router=useRouter();const [tab,setTab]=useState<Tab>('personal');
 const [user,setUser]=useState<Profile|null>(null),[name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState('');
 const [prefs,setPrefs]=useState({emailUpdates:true,smsUpdates:true,marketing:false});
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[saving,setSaving]=useState(false),[verifyUrl,setVerifyUrl]=useState('');
 useEffect(()=>{api<Profile>('/me').then(u=>{setUser(u);setName(u.name);setEmail(u.email);setPhone(u.phone);setPrefs(u.preferences);}).catch(e=>setError((e as Error).message));},[]);
 async function savePersonal(e:FormEvent){e.preventDefault();setError('');setNotice('');setSaving(true);try{const u=await send<Profile>('/me','PATCH',{name,email,phone});setUser(u);setNotice('Profile updated on the server.'+(u.verifiedEmail?'':' Your changed email is unverified until an email provider is connected.'));}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 async function savePassword(e:FormEvent){e.preventDefault();setError('');setNotice('');if(next!==confirm)return setError('The new passwords do not match.');setSaving(true);try{await send('/me/password','POST',{currentPassword:current,newPassword:next});router.replace('/login');}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 async function savePreferences(e:FormEvent){e.preventDefault();setError('');setNotice('');setSaving(true);try{await send('/me/preferences','PUT',prefs);setNotice('Preferences saved.');}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 async function requestVerify(){try{const r=await send<{ok:boolean;demoVerifyUrl?:string;message?:string}>('/me/verification/request','POST');setVerifyUrl(r.demoVerifyUrl||'');setNotice(r.demoVerifyUrl?'Test verification link created.':'Verification email sent.');}catch(e){setError((e as Error).message);}}
 async function deleteAccount(){const pass=window.prompt('To permanently delete your account and all its data, enter your current password:');if(!pass)return;if(!window.confirm('Permanently delete your account? This cannot be undone.'))return;try{await send('/me','DELETE',{password:pass});router.replace('/login');}catch(e){setError((e as Error).message);}}
 return <OrdersShell><div className={base.page}>
 <div className={base.heading}><div><h1>Account Settings</h1><p>Manage your personal information, security and account preferences.</p></div></div>
 <div className={styles.tabs} role="tablist" aria-label="Account settings sections">
 {([{id:'personal',label:'Personal Info',icon:UserRound},{id:'security',label:'Security',icon:LockKeyhole},{id:'preferences',label:'Preferences',icon:SlidersHorizontal}] as const).map(({id,label,icon:Icon})=><button key={id} role="tab" aria-selected={tab===id} className={`${styles.tab} ${tab===id?styles.active:''}`} onClick={()=>{setTab(id);setError('');setNotice('');}}><Icon size={17}/>{label}</button>)}
 </div>
 {tab==='personal'&&<section className={styles.section} role="tabpanel"><header className={styles.sectionHeader}><div className={styles.sectionIcon}><UserRound size={23}/></div><div><h2>Personal Information</h2><p>Keep your contact details up to date for a smoother experience.</p></div></header><form onSubmit={savePersonal} className={styles.formGrid}>
 <label className={styles.field}>Full Name<input required value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className={styles.field}><span className={styles.labelRow}>Email Address {user?.verifiedEmail&&email===user.email&&<span className={styles.verified}>✓ Verified</span>}</span><input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/><small>We use your email for receipts and order updates. Changes require verification when email delivery is configured.</small></label>
 <label className={styles.field}><span className={styles.labelRow}>Phone Number {user?.verifiedPhone&&phone===user.phone&&<span className={styles.verified}>✓ Verified</span>}</span><input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/><small>Used to coordinate collections and deliveries.</small></label>
 <div className={styles.actions}><button disabled={saving} className={styles.button}>{saving?'Saving…':'Save Changes'}</button></div></form>{user&&!user.verifiedEmail&&<div style={{marginTop:22}}><button type="button" className={styles.outline} onClick={()=>void requestVerify()}>Verify email</button>{verifyUrl&&<a href={verifyUrl} style={{display:'inline-block',marginLeft:16,color:'#1264aa'}}>Open test verification link</a>}</div>}</section>}
 {tab==='security'&&<section className={styles.section} role="tabpanel"><header className={styles.sectionHeader}><div className={styles.sectionIcon}><LockKeyhole size={23}/></div><div><h2>Password & Security</h2><p>Change your password and secure access to your account.</p></div></header><form className={styles.formGrid} onSubmit={savePassword}>
 <label className={styles.field}>Current password<input required type="password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)}/></label>
 <label className={styles.field}>New password<input required minLength={10} type="password" autoComplete="new-password" value={next} onChange={e=>setNext(e.target.value)}/><small>Use at least 10 characters, ideally a unique passphrase.</small></label>
 <label className={styles.field}>Confirm new password<input required type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
 <div className={styles.actions}><button disabled={saving} className={styles.button}>Update Password</button></div></form>
 <div className={styles.danger}><Trash2 size={19}/> Permanently delete account and associated data <button onClick={()=>void deleteAccount()}>Delete Account</button></div></section>}
 {tab==='preferences'&&<section className={styles.section} role="tabpanel"><header className={styles.sectionHeader}><div className={styles.sectionIcon}><SlidersHorizontal size={23}/></div><div><h2>Communication Preferences</h2><p>Choose the kinds of updates you'd like to receive.</p></div></header><form onSubmit={savePreferences}>
 {([{key:'emailUpdates',title:'Order updates by email',desc:'Pickup confirmations, tracking and delivery notifications.'},{key:'smsUpdates',title:'Order updates by SMS',desc:'Collection and delivery reminders to your phone.'},{key:'marketing',title:'Offers and laundry care tips',desc:'Optional promotional announcements.'}] as const).map(row=><label key={row.key} className={styles.toggleRow}><span><strong>{row.title}</strong><small>{row.desc}</small></span><input type="checkbox" checked={prefs[row.key]} onChange={e=>setPrefs(p=>({...p,[row.key]:e.target.checked}))}/></label>)}
 <p style={{color:'#71869f',fontSize:12,marginTop:14}}>Preferences are saved in your account. Actual email and SMS delivery needs a notification provider.</p><div className={styles.actions}><button disabled={saving} className={styles.button}>Save Preferences</button></div></form></section>}
 {notice&&<p role="status" className={styles.toast}>{notice}</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}
 </div></OrdersShell>;
}
