"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Check,Info} from 'lucide-react';
import {OrdersShell} from '../../my-orders/OrdersShell';
import {api,send,type Address,type Profile} from '../../lib/api';
import styles from '../../customer.module.css';
type FormAddress={label:string;street:string;area:string;region:string;phone:string;instructions:string;isDefault:boolean};
const initial:FormAddress={label:'Home',street:'',area:'',region:'Greater Accra',phone:'',instructions:'',isDefault:false};
export default function AddressForm(){
 const router=useRouter();const [edit,setEdit]=useState<string|null>(null);
 const [form,setForm]=useState<FormAddress>(initial),[step,setStep]=useState(1),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{setEdit(new URLSearchParams(window.location.search).get('edit'));},[]);
 useEffect(()=>{api<Profile>('/me').then(p=>setForm(o=>({...o,phone:o.phone||p.phone}))).catch(()=>{});if(edit)api<Address[]>('/addresses').then(all=>{const a=all.find(x=>String(x.id)===edit);if(a)setForm(a);}).catch(e=>setError((e as Error).message));},[edit]);
 const change=(key:keyof FormAddress,value:string|boolean)=>setForm(old=>({...old,[key]:value}));
 function next(e:FormEvent){e.preventDefault();setError('');if(step===1&&(!form.street.trim()||!form.area.trim()||!form.label.trim()))return setError('Complete the address fields to continue.');if(step===2&&form.phone.replace(/\D/g,'').length<9)return setError('Enter a valid contact number.');setStep(s=>Math.min(3,s+1));}
 async function save(){setSaving(true);setError('');try{await send(`/addresses${edit?'/'+edit:''}`,edit?'PUT':'POST',form);router.push('/saved-addresses');}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 return <OrdersShell><div className={`${styles.page} ${styles.formWrap}`}>
 <div className={styles.heading}><div><h1>{edit?'Edit Address':'Add New Address'}</h1><p>Set this location up once and reuse it for laundry pickups.</p></div><Link className={styles.secondary} href="/saved-addresses"><ArrowLeft size={17}/> Back</Link></div>
 <div className={styles.steps}>{[1,2,3].map(n=><span className={`${styles.stepSegment} ${n<=step?styles.stepOn:''}`} key={n}/>)}</div><p className={styles.stepCaption}>Step {step} of 3 · {['Address details','Contact & directions','Review & save'][step-1]}</p>
 <form className={styles.formCard} onSubmit={next}>
 {step===1&&<><h2>Where should we collect your laundry?</h2><p>Give this address a label you'll recognize when booking.</p><label className={styles.field}>Label<select value={form.label} onChange={e=>change('label',e.target.value)}><option>Home</option><option>Office</option><option>University</option><option>Family House</option><option>Other</option></select></label><label className={styles.field}>Street / building / house number<input required value={form.street} onChange={e=>change('street',e.target.value)} placeholder="House number and street"/></label><div className={styles.fields}><label className={styles.field}>Neighbourhood / city<input value={form.area} required onChange={e=>change('area',e.target.value)} placeholder="e.g. East Legon, Accra"/></label><label className={styles.field}>Region<input value={form.region} required onChange={e=>change('region',e.target.value)}/></label></div></>}
 {step===2&&<><h2>How can the rider find you?</h2><p>The phone number and directions help avoid missed pickups.</p><label className={styles.field}>Phone number<input type="tel" required value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="+233 24 123 4567"/></label><label className={styles.field}>Landmark or pickup instructions<textarea value={form.instructions} onChange={e=>change('instructions',e.target.value)} placeholder="Gate, landmark, apartment number or receptionist (optional)"/></label></>}
 {step===3&&<><h2>Review your address</h2><div className={styles.reviewPanel}><div><span>Label</span><strong>{form.label}</strong></div><div><span>Address</span><strong>{form.street}, {form.area}, {form.region}</strong></div><div><span>Phone</span><strong>{form.phone}</strong></div><div><span>Directions</span><strong>{form.instructions||'None'}</strong></div></div><label className={styles.checkRow}><input checked={form.isDefault} type="checkbox" onChange={e=>change('isDefault',e.target.checked)}/> Use as my default pickup address</label></>}
 {error&&<p role="alert" className={styles.warning}>{error}</p>}
 <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={()=>step===1?router.push('/saved-addresses'):setStep(s=>s-1)}><ArrowLeft size={16}/>{step===1?'Cancel':'Previous'}</button>{step<3?<button type="submit" className={styles.primary}>Continue <ArrowRight size={16}/></button>:<button type="button" disabled={saving} className={styles.primary} onClick={()=>void save()}><Check size={16}/>{saving?'Saving…':'Save Address'}</button>}</div></form>
 </div></OrdersShell>;
}
