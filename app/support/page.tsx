"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Headphones,Send} from 'lucide-react';
import {OrdersShell} from '../my-orders/OrdersShell';
import {api,send,type ChatMessage} from '../lib/api';
import styles from '../customer.module.css';
export default function Support(){
 const [messages,setMessages]=useState<ChatMessage[]>([]),[draft,setDraft]=useState(''),[error,setError]=useState(''),[sending,setSending]=useState(false);
 const bottom=useRef<HTMLDivElement>(null);
 useEffect(()=>{let active=true;async function refresh(){try{const data=await api<ChatMessage[]>('/support/messages');if(active)setMessages(data);}catch(e){if(active)setError((e as Error).message);}}void refresh();const timer=setInterval(()=>void refresh(),5000);return()=>{active=false;clearInterval(timer);};},[]);
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages.length]);
 async function post(e:FormEvent){e.preventDefault();if(!draft.trim())return;setSending(true);setError('');try{await send('/support/messages','POST',{body:draft.trim()});setDraft('');setMessages(await api('/support/messages'));}catch(e){setError((e as Error).message);}finally{setSending(false);}}
 return <OrdersShell><div className={styles.page}><div className={styles.heading}><div><h1>Support</h1><p>Message Dee's Laundromat about pickups, orders or any questions.</p></div></div>
 <div className={styles.chatPane} style={{maxWidth:980,minHeight:600,margin:'0 auto',height:'min(72vh,760px)'}}>
 <div className={styles.chatHead}><span className={styles.supportAvatar}><Headphones size={22}/></span><div><strong>Dee’s Laundromat Support</strong><small>One conversation with our support team · replies from staff</small></div></div>
 <div className={styles.chatMessages} aria-live="polite" style={{flex:1,overflowY:'auto'}}>{messages.map(m=><div key={m.id} className={`${styles.bubbleWrap} ${m.sender==='customer'?styles.own:''}`}><div className={styles.bubble}>{m.body}</div><span className={styles.bubbleTime}>{new Date(m.created_at).toLocaleString('en-GB',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})} · {m.sender==='customer'?'You':'Dee’s Support'}</span></div>)}<div ref={bottom}/></div>
 {error&&<p role="alert" className={styles.warning}>{error}</p>}
 <form className={styles.chatComposer} onSubmit={post}><input required aria-label="Message support" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type your message…"/><button disabled={sending} title="Send message" aria-label="Send message" type="submit"><Send size={18}/></button></form>
 </div></div></OrdersShell>;
}
