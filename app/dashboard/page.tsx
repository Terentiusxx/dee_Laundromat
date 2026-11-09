"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CalendarDays,Check,Clock3,CreditCard,Headphones,House,MapPin,Package,Plus,ShieldCheck,Store,Truck} from 'lucide-react';
import {OrdersShell} from '../my-orders/OrdersShell';
import {api,day,money,headlineStatus,type LaundryOrder,type Address,type PaymentMethod,type Profile} from '../lib/api';
import styles from './dashboard.module.css';
const features=[{label:'Pickup & Delivery',desc:'Reliable service at your doorstep.',icon:Truck},{label:'In-Store Service',desc:'Drop off and collect your garments.',icon:Store},{label:'Standard & Express',desc:'Choose what fits your schedule.',icon:Clock3},{label:'Quality Care',desc:'Carefully handled garments.',icon:ShieldCheck}];
export default function Dashboard(){
 const [orders,setOrders]=useState<LaundryOrder[]>([]),[addresses,setAddresses]=useState<Address[]>([]),[payments,setPayments]=useState<PaymentMethod[]>([]),[name,setName]=useState('Customer');
 const [error,setError]=useState('');
 useEffect(()=>{Promise.all([api<LaundryOrder[]>('/orders'),api<Address[]>('/addresses'),api<PaymentMethod[]>('/payment-methods'),api<Profile>('/me')]).then(([o,a,p,u])=>{setOrders(o);setAddresses(a);setPayments(p);setName(u.name);}).catch(e=>setError((e as Error).message));},[]);
 return <OrdersShell><div className={styles.content}>
 <div className={styles.welcome} style={{marginLeft:0,minHeight:'auto',marginBottom:26}}><p className={styles.eyebrow}>GOOD TO SEE YOU,</p><h1>Welcome back, {name.split(' ')[0]}.</h1><p>Ready for a fresher day? Book a pickup or check the latest on your orders.</p></div>
 <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.heroEyebrow}>FRESHER DAYS AHEAD</p><h2>Schedule a laundry pickup.</h2><p>We'll collect, clean, and return your clothes<br/>so you can focus on what matters.</p><Link className={styles.primaryButton} href="/book-a-pickup">Book a Pickup <ArrowRight size={19}/></Link></div></section>
 <section className={styles.features}>{features.map(({label,desc,icon:Icon})=><div key={label} className={styles.feature}><span className={styles.featureIcon}><Icon size={25}/></span><div><h3>{label}</h3><p>{desc}</p></div></div>)}</section>
 {error&&<p role="alert">{error}</p>}
 <div className={styles.dataGrid}><section className={styles.ordersPanel}><div className={styles.panelTitle}><h2>Your Orders</h2><Link className={styles.textLink} href="/my-orders">View all orders <ArrowRight size={18}/></Link></div>
 <div className={styles.orderList}>{orders.length?orders.slice(0,3).map(o=><Link key={o.id} className={styles.orderRow} href={`/my-orders/${encodeURIComponent(o.reference)}`}>
 <img className={styles.orderThumbnail} src={o.items[0]?.service_id==='dry'?'/images/order-2.webp':'/images/order-1.webp'} alt="Laundry"/>
 <div className={styles.orderInfo}><div className={styles.orderInfoTop}><strong>#{o.reference}</strong><span className={styles.status}>{headlineStatus(o.status)}</span></div><p>{o.items.map(i=>i.title).join(', ')||'Laundry care'} · {o.items.length} services</p><small>{day(o.pickup_date)} · {o.pickup_slot} · {money(o.total)}</small></div><ArrowRight size={18}/></Link>):<div style={{padding:'30px 10px',color:'#71839b'}}>No orders yet. Your new bookings will appear here. <Link href="/book-a-pickup">Make your first booking.</Link></div>}</div></section>
 <aside className={styles.rightCards}><section className={styles.miniPanel}><div className={styles.miniTitle}><h2>Saved Addresses</h2><Link className={styles.textLink} href="/saved-addresses">Manage <ArrowRight size={16}/></Link></div><div className={styles.savedList}>{addresses.slice(0,2).map(a=><div key={a.id} className={styles.miniAddress}><span className={styles.roundSmall}>{a.label==='Home'?<House size={20}/>:<MapPin size={20}/>}</span><div className={styles.addressText}><strong>{a.label}{a.isDefault?' · Default':''}</strong><p>{a.street}, {a.area}</p></div></div>)}</div><Link className={styles.softButton} href="/saved-addresses/new"><Plus size={16}/> Add New Address</Link></section>
 <section className={styles.miniPanel}><div className={styles.miniTitle}><h2>Payment Methods</h2><Link className={styles.textLink} href="/payments">Manage <ArrowRight size={16}/></Link></div>{payments.slice(0,1).map(p=><div className={styles.paymentCard} key={p.id}><span className={styles.visa}>{p.kind==='visa'?'VISA':p.kind==='mastercard'?'MC':'MoMo'}</span><strong>•••• {p.last4}</strong>{p.isDefault&&<span className={styles.defaultBadge}>Default</span>}</div>)}<Link className={styles.softButton} href="/payments/add"><Plus size={16}/> Add Payment Method</Link></section></aside></div>
 </div></OrdersShell>;
}
