"use client";
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {CalendarDays,ArrowRight,Search,PackageOpen,Shirt,Store,Truck} from 'lucide-react';
import {OrdersShell} from './OrdersShell';
import {useRemote,day,money,headlineStatus,type LaundryOrder} from '../lib/api';
import styles from './orders.module.css';
type Tab='All Orders'|'Active'|'Completed'|'Cancelled';
const tabs:Tab[]=['All Orders','Active','Completed','Cancelled'];
const group=(o:LaundryOrder):Tab=>o.status==='cancelled'?'Cancelled':o.status==='delivered'||(o.method==='store'&&o.status==='collected')?'Completed':'Active';
const statusClass=(o:LaundryOrder)=>o.status==='cancelled'?styles.cancelled:o.status==='ready'?styles.ready:o.status==='delivered'||(o.method==='store'&&o.status==='collected')?styles.completed:styles.inProgress;
const imageFor=(o:LaundryOrder)=>o.items[0]?.service_id==='dry'?'/images/my-order-2.webp':o.items[0]?.service_id==='iron'?'/images/order-3.webp':'/images/my-order-1.webp';
function Card({o}:{o:LaundryOrder}){const store=o.method==='store';return <article className={styles.orderCard}>
 <div className={styles.cardImageWrap}><img className={styles.cardImage} src={imageFor(o)} alt="Freshly cleaned clothes" loading="lazy"/><span className={`${styles.statusBadge} ${statusClass(o)}`}><span className={styles.statusDot}/>{headlineStatus(o.status)}</span></div>
 <div className={styles.cardBody}><h2>{o.reference}</h2><p className={styles.cardService}>{store?'In-Store Drop-off':'Pickup & Delivery'} <span className={styles.separator}>·</span> {o.items.map(i=>i.title).join(', ')}</p>
 <div className={styles.cardSchedule}><div className={styles.scheduleInfo}><CalendarDays size={20}/><span><strong>{store?'Visit date':'Pickup date'}</strong><small>{day(o.pickup_date)}</small><small>{o.pickup_slot}</small></span></div><div className={styles.scheduleInfo}>{store?<Store size={20}/>:<Truck size={20}/>}<span><strong>{store?'Store collection':'Return delivery'}</strong><small>{headlineStatus(o.status)}</small><small>{o.speed==='express'?'Express care':'Standard care'}</small></span></div></div>
 <div className={styles.cardBottom}><span><Shirt size={19}/>{o.items.reduce((sum,i)=>sum+i.qty,0)} service units</span><strong>{money(o.total)}</strong></div>
 <Link href={`/my-orders/${encodeURIComponent(o.reference)}`} className={styles.viewButton}>View Order <ArrowRight size={19}/></Link></div></article>}
export default function MyOrders(){
 const {data:orders,loading,error,reload}=useRemote<LaundryOrder[]>('/orders',[]);const [tab,setTab]=useState<Tab>('All Orders'),[term,setTerm]=useState(''),[range,setRange]=useState('3m');
 const filtered=useMemo(()=>orders.filter(o=>{
  if(tab!=='All Orders'&&group(o)!==tab)return false;
  if(range!=='all'){const created=new Date(o.created_at).getTime(),now=Date.now();const days=range==='30d'?30:range==='3m'?92:31;if(range==='month'){const d=new Date(o.created_at),today=new Date();if(d.getMonth()!==today.getMonth()||d.getFullYear()!==today.getFullYear())return false;}else if(created<now-days*86400000)return false;}
  const q=term.toLowerCase().trim();return !q||[o.reference,o.status,o.method,...o.items.map(i=>i.title)].some(x=>x.toLowerCase().includes(q));
 }),[orders,tab,term,range]);
 return <OrdersShell><div className={styles.headingRow}><div className={styles.titleGroup}><h1>My Orders</h1><p>Track and manage your laundry orders.</p></div><div className={styles.toolbar}><label className={styles.searchBox}><Search size={20}/><input aria-label="Search orders" placeholder="Search orders…" value={term} onChange={e=>setTerm(e.target.value)}/></label><label className={styles.selectBox}><CalendarDays size={19}/><select value={range} aria-label="Filter by date" onChange={e=>setRange(e.target.value)}><option value="3m">Last 3 months</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="all">All time</option></select></label></div></div>
 <div className={styles.tabs} role="tablist">{tabs.map(t=><button role="tab" aria-selected={tab===t} key={t} className={`${styles.tab} ${tab===t?styles.activeTab:''}`} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {loading?<p>Loading your orders…</p>:error?<div role="alert">{error} <button onClick={()=>void reload()}>Try again</button></div>:filtered.length?<div className={styles.cardsGrid}>{filtered.map(o=><Card key={o.id} o={o}/>)}</div>:<div className={styles.emptyState}><PackageOpen size={42}/><h2>No orders found</h2><p>Try a different filter, or schedule your first laundry pickup.</p><Link href="/book-a-pickup" className={styles.viewButton}>Book a Pickup</Link></div>}
 <p className={styles.demoFootnote}>Orders are stored in the backend. This test environment does not dispatch real riders or charge live payments.</p></OrdersShell>;
}
