"use client";
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,CalendarDays,Check,CheckCircle2,Clock3,CreditCard,Download,MapPin,Package,Shirt,Store,Truck,XCircle} from 'lucide-react';
import {OrdersShell} from '../OrdersShell';
import {useRemote,send,day,money,headlineStatus,type LaundryOrder} from '../../lib/api';
import styles from '../orders.module.css';
export default function OrderDetails(){
 const params=useParams<{id:string}>(),ref=decodeURIComponent(params.id);
 const {data:o,loading,error,reload}=useRemote<LaundryOrder|null>(`/orders/${encodeURIComponent(ref)}`,null);
 const [notice,setNotice]=useState('');
 if(loading)return <OrdersShell><div className={styles.detailNotFound}>Loading order…</div></OrdersShell>;
 if(!o)return <OrdersShell><div className={styles.detailNotFound}><Package size={44}/><h1>Order not found</h1><p>{error||'We could not locate that order.'}</p><Link href="/my-orders">Back to My Orders</Link></div></OrdersShell>;
 const store=o.method==='store',cancelled=o.status==='cancelled';
 const steps=store?['booked','received','cleaning','ready','collected']:['booked','collected','cleaning','out_for_delivery','delivered'];
 const current=steps.indexOf(o.status);
 async function cancel(){if(!confirm('Cancel this booking?'))return;try{await send(`/orders/${encodeURIComponent(ref)}/cancel`,'POST');setNotice('Booking cancelled.');await reload();}catch(e){setNotice((e as Error).message);}}
 const address=(a:LaundryOrder['pickupAddress'])=>a?`${a.street}, ${a.area}, ${a.region}`:'Not applicable';
 return <OrdersShell>
 <div className={styles.detailBack}><Link href="/my-orders"><ArrowLeft size={18}/> Back to My Orders</Link></div>
 <div className={styles.detailHeader}><div><span className={styles.detailEyebrow}>ORDER DETAILS</span><h1>{o.reference}</h1><p>Placed {day(o.created_at)} · {store?'In-Store Drop-off':'Pickup & Delivery'}</p></div><span className={`${styles.detailStatus} ${cancelled?styles.cancelled:o.status==='ready'?styles.ready:(o.status==='delivered'||(store&&o.status==='collected'))?styles.completed:styles.inProgress}`}>{headlineStatus(o.status)}</span></div>
 <div className={styles.detailLayout}><div className={styles.detailMain}>
 <section className={styles.detailPanel}><h2>Order tracking</h2><p className={styles.detailMuted}>Updates appear here when Dee's Laundromat staff process your laundry.</p>
 {cancelled?<div className={styles.cancelBanner}><XCircle size={26}/><strong>This order has been cancelled.</strong></div>:<div className={styles.detailTimeline}>{steps.map((s,i)=><div key={s} className={`${styles.detailStage} ${i<current?styles.stageDone:''} ${i===current?styles.stageCurrent:''}`}><span className={styles.stageCircle}>{i<current?<Check size={16}/>:i+1}</span><strong>{headlineStatus(s)}</strong><small>{i<current?'Complete':i===current?'Current stage':'Upcoming'}</small></div>)}</div>}
 <div className={styles.statusExplanation}><CheckCircle2 size={22}/><span>{cancelled?'The booking is cancelled.':o.status==='cleaning'?'We are taking care of your garments.':o.status==='ready'?'Your laundry is ready for in-store collection.':o.status==='booked'?'Booking received. Awaiting collection/drop-off.':'Your order status is updated by laundry staff.'}</span></div>
 {o.events.length>0&&<div style={{marginTop:20}}><h3 style={{fontSize:15,marginBottom:10}}>Activity history</h3>{o.events.map((e,i)=><p key={i} style={{fontSize:13,color:'#607b92'}}>{day(e.created_at)} · {headlineStatus(e.status)} {e.note?'— '+e.note:''}</p>)}</div>}
 </section>
 <section className={styles.detailPanel}><h2>Your laundry</h2><div className={styles.itemRows}>{o.items.map(item=><div className={styles.itemRow} key={item.id}><div><strong>{item.title}</strong><span>{item.qty} {item.unit}{item.unit==='item'&&item.qty!==1?'s':''} × {money(item.unit_rate)}</span></div><strong>{money(item.total)}</strong></div>)}</div></section>
 </div><div className={styles.detailAside}>
 <section className={styles.detailPanel}><h2>Booking information</h2>
 <div className={styles.infoRow}><span><CalendarDays size={18}/>{store?'Visit':'Pickup'}</span><strong>{day(o.pickup_date)}<small>{o.pickup_slot}</small></strong></div>
 <div className={styles.infoRow}><span><MapPin size={18}/> {store?'Store':'Pickup address'}</span><strong>{store?'Sample branch (test only)':address(o.pickupAddress)}</strong></div>
 {!store&&<div className={styles.infoRow}><span><Truck size={18}/> Delivery address</span><strong>{address(o.deliveryAddress)}</strong></div>}
 <div className={styles.infoRow}><span><Clock3 size={18}/> Care speed</span><strong>{o.speed==='express'?'Express':'Standard'}</strong></div>
 <div className={styles.infoRow}><span>Contact number</span><strong>{o.contact_phone}</strong></div>{o.instructions&&<div className={styles.infoRow}><span>Notes</span><strong>{o.instructions}</strong></div>}
 </section>
 <section className={styles.detailPanel}><h2>Payment summary</h2><div className={styles.infoRow}><span><CreditCard size={18}/> Payment choice</span><strong>{o.payment_choice==='later'?'Pay Later':'Simulated Online'}</strong></div><div className={styles.infoRow}><span>Payment status</span><strong>{o.payment_status==='demo_paid'?'Paid in test mode':'Unpaid'}</strong></div><div className={styles.infoRow}><span>Subtotal</span><strong>{money(o.subtotal)}</strong></div><div className={styles.infoRow}><span>Express surcharge</span><strong>{money(o.express_fee)}</strong></div><div className={styles.totalRow}><span>Estimated total</span><strong>{money(o.total)}</strong></div><p className={styles.pricingFootnote}>Estimated prices may change after items are weighed and inspected. Payments in this demo do not move money.</p><button className={styles.receiptButton} onClick={()=>window.print()}><Download size={17}/> Print summary</button></section>
 {o.status==='booked'&&<button className={styles.receiptButton} onClick={()=>void cancel()}>Cancel booking</button>}{notice&&<p role="status">{notice}</p>}
 <Link href="/book-a-pickup" className={styles.anotherBooking}>Book another pickup <ArrowRight size={16}/></Link>
 </div></div></OrdersShell>;
}
