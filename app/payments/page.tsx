"use client";
import Link from 'next/link';
import {useState} from 'react';
import {CheckCircle2,Plus,ShieldCheck,Trash2} from 'lucide-react';
import {OrdersShell} from '../my-orders/OrdersShell';
import {useRemote,send,type PaymentMethod} from '../lib/api';
import styles from '../customer.module.css';
const Brand=({m}:{m:PaymentMethod})=>m.kind==='visa'?<span className={styles.visa}>VISA</span>:m.kind==='mastercard'?<span className={styles.mastercard} aria-label="Mastercard"><span/><span/></span>:<span className={styles.momo}>{m.provider||'MTN MoMo'}</span>;
export default function PaymentMethods(){
 const {data,loading,error,reload}=useRemote<PaymentMethod[]>('/payment-methods',[]);const [message,setMessage]=useState('');
 async function run(call:()=>Promise<unknown>){try{await call();await reload();setMessage('Changes saved.');}catch(e){setMessage((e as Error).message);}}
 return <OrdersShell><div className={styles.page}><div className={styles.heading}><div><h1>Payment Methods</h1><p>Your saved payment preferences, ready for faster checkout.</p></div><Link className={styles.primary} href="/payments/add"><Plus size={17}/> Add Payment Method</Link></div>
 {loading?<p>Loading payment methods…</p>:error?<p role="alert">{error}</p>:<div className={styles.grid3}>{data.map(m=><article key={m.id} className={`${styles.card} ${styles.methodCard} ${m.isDefault?styles.defaultCard:''}`}>
 <div className={styles.methodTop}>{m.isDefault?<span className={styles.defaultBadge}><CheckCircle2 size={13}/> Default</span>:<span/>}<small>SAVED</small></div><div className={styles.methodLogo}><Brand m={m}/></div>
 <strong>{m.kind==='momo'?m.provider||'Mobile Money':m.kind==='visa'?'Visa':'Mastercard'} ···· {m.last4}</strong><small>{m.kind==='momo'?'Mobile Money account':`Expires ${m.expiry||'—'}`}</small>
 <div className={styles.cardActions}>{m.isDefault?<span style={{color:'#278465',fontSize:12}}>Default at checkout</span>:<button className={styles.secondary} style={{fontSize:12,minHeight:36}} onClick={()=>void run(()=>send(`/payment-methods/${m.id}/default`,'POST'))}>Set as Default</button>}<span style={{flex:1}}/><button className={styles.textButton} style={{color:'#c83d50'}} onClick={()=>{if(confirm('Remove this payment method?'))void run(()=>send(`/payment-methods/${m.id}`,'DELETE'));}}><Trash2 size={16}/> Remove</button></div>
 </article>)}</div>}
 {message&&<p role="status" className={styles.success}>{message}</p>}
 <div className={styles.note} style={{marginTop:24}}><ShieldCheck size={21}/><span><strong>Test payment aliases only.</strong> The demo stores brand, last four digits and optional provider—never actual card numbers or PINs. Real online payments require a payment gateway. Pay Later is available at checkout.</span></div>
 </div></OrdersShell>;
}
