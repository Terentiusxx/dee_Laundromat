"use client";
import Link from 'next/link';
import {useState} from 'react';
import {CheckCircle2,House,MapPin,Phone,Pencil,Trash2,Plus,BriefcaseBusiness,GraduationCap,Info} from 'lucide-react';
import {OrdersShell} from '../my-orders/OrdersShell';
import {useRemote,send,type Address} from '../lib/api';
import styles from '../customer.module.css';
const iconFor=(label:string)=>/home|family/i.test(label)?House:/office|work/i.test(label)?BriefcaseBusiness:/university|campus/i.test(label)?GraduationCap:MapPin;
export default function SavedAddresses(){
 const {data:addresses,loading,error,reload}=useRemote<Address[]>('/addresses',[]);
 const [notice,setNotice]=useState('');
 async function run(action:()=>Promise<unknown>){try{await action();await reload();setNotice('Changes saved.');}catch(e){setNotice((e as Error).message);}}
 return <OrdersShell><div className={styles.page}>
 <div className={styles.heading}><div><h1>Saved Addresses</h1><p>Manage pickup and delivery locations for faster bookings.</p></div><Link className={styles.primary} href="/saved-addresses/new"><Plus size={17}/> Add New Address</Link></div>
 {loading?<p>Loading addresses…</p>:error?<p role="alert">{error}</p>:<div className={styles.grid3}>{addresses.map(a=>{const Icon=iconFor(a.label);return <article key={a.id} className={`${styles.card} ${a.isDefault?styles.defaultCard:''}`}>
 <div className={styles.addressTop}><span className={styles.addressIcon}><Icon size={24}/></span><h2>{a.label}</h2>{a.isDefault&&<span className={styles.defaultBadge}><CheckCircle2 size={14}/> Default</span>}</div>
 <div className={styles.addressInfo}><div className={styles.addressLine}><MapPin size={17}/><span>{a.street}<br/>{a.area}<br/>{a.region}</span></div><div className={styles.addressLine}><Phone size={16}/><span>{a.phone}</span></div></div>
 <div className={styles.cardActions}><Link className={styles.textButton} href={`/saved-addresses/new?edit=${a.id}`}><Pencil size={16}/> Edit</Link><button className={styles.textButton} style={{color:'#c83d50'}} onClick={()=>{if(confirm('Remove this address? Existing orders will retain their original delivery details.'))void run(()=>send(`/addresses/${a.id}`,'DELETE'));}}><Trash2 size={16}/> Delete</button><span style={{flex:1}}/>{!a.isDefault&&<button className={styles.secondary} style={{fontSize:11,padding:'7px 10px',minHeight:35}} onClick={()=>void run(()=>send(`/addresses/${a.id}/default`,'POST'))}>Set as Default</button>}</div>
 </article>})}</div>}
 {!loading&&!addresses.length&&<div className={styles.empty}><MapPin size={32}/><h2>No saved addresses yet</h2><p>Save a pickup address once, then select it whenever you book.</p><Link href="/saved-addresses/new" className={styles.primary}>Add your first address</Link></div>}
 {notice&&<p role="status" className={styles.success}>{notice}</p>}
 <div className={styles.note} style={{marginTop:22}}><Info size={18}/> <span>The default address is preselected during booking. You can choose a different location for delivery or save another address at any time.</span></div>
 </div></OrdersShell>;
}
