"use client";
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,CreditCard,ShieldCheck} from 'lucide-react';
import {OrdersShell} from '../../my-orders/OrdersShell';
import {send} from '../../lib/api';
import styles from '../../customer.module.css';
export default function AddPayment(){
 const router=useRouter(),[kind,setKind]=useState<'visa'|'mastercard'|'momo'>('visa'),[last4,setLast4]=useState(''),[expiry,setExpiry]=useState('08/28'),[provider,setProvider]=useState('MTN MoMo'),[defaultMethod,setDefault]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 async function save(e:FormEvent){e.preventDefault();if(!/^\d{4}$/.test(last4))return setError('Enter exactly four test digits.');setSaving(true);try{await send('/payment-methods','POST',{kind,last4,expiry:kind==='momo'?null:expiry,provider:kind==='momo'?provider:null,isDefault:defaultMethod});router.push('/payments');}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 return <OrdersShell><div className={`${styles.page} ${styles.formWrap}`}><div className={styles.heading}><div><h1>Add Payment Method</h1><p>Save a test payment alias to see how checkout will work.</p></div><Link className={styles.secondary} href="/payments"><ArrowLeft size={17}/> Back</Link></div>
 <form className={styles.formCard} onSubmit={save}><h2>Choose a payment type</h2><div className={styles.choiceGrid}>{(['visa','mastercard','momo'] as const).map(k=><button type="button" key={k} className={`${styles.pillChoice} ${kind===k?styles.defaultCard:''}`} onClick={()=>setKind(k)}>{k==='momo'?'Mobile Money':k==='visa'?'Visa':'Mastercard'}</button>)}</div>
 {kind==='momo'&&<label className={styles.field}>Provider<select value={provider} onChange={e=>setProvider(e.target.value)}><option>MTN MoMo</option><option>Telecel Cash</option><option>AirtelTigo Money</option></select></label>}
 <label className={styles.field}>{kind==='momo'?'Last 4 digits of test MoMo number':'Last 4 digits of test card'}<input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={last4} onChange={e=>setLast4(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4242"/></label>
 {kind!=='momo'&&<label className={styles.field}>Sample expiry (MM/YY)<input required value={expiry} onChange={e=>setExpiry(e.target.value)} placeholder="08/28"/></label>}
 <label className={styles.checkRow}><input type="checkbox" checked={defaultMethod} onChange={e=>setDefault(e.target.checked)}/> Set as my default payment preference</label>
 <div className={styles.note}><ShieldCheck size={18}/><span>Do not enter an actual card number, PIN, CVV or mobile-money authentication code. This is test metadata, not an active payment connection.</span></div>
 {error&&<p role="alert" className={styles.warning}>{error}</p>}<div className={styles.formActions}><Link href="/payments" className={styles.secondary}>Cancel</Link><button disabled={saving} className={styles.primary}><CreditCard size={16}/>{saving?'Saving…':'Save Test Method'}</button></div></form></div></OrdersShell>;
}
