"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
  ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Clock3, CreditCard, Headphones, House,
  Info, LogOut, MapPin, Menu, Minus, Package, Plus, ShieldCheck,
  Shirt, Sparkles, Store, Truck, UserRound, Wallet, X, type LucideIcon,
} from "lucide-react";
import styles from "./booking.module.css";
import {api,send,type Address as RemoteAddress,type PaymentMethod as RemotePayment,type Service as RemoteService,type LaundryOrder,type Profile} from "../lib/api";
type CustomerAddress=Omit<RemoteAddress,'id'>&{id:string};
type CustomerPayment=Omit<RemotePayment,'id'>&{id:string};

type Method = "pickup" | "store";
type Payment = "online" | "later";
type Speed = "standard" | "express";
type ServiceID = "wash" | "dry" | "iron" | "bedding";
type Service = { id: ServiceID; title: string; caption: string; rate: number; unit: string; image: string; maximum: number; };
type Address = { street: string; area: string; landmark: string };

const SERVICES: Service[] = [
  { id: "wash", title: "Wash & Fold", caption: "Everyday clothing, carefully washed and folded.", rate: 12, unit: "kg", image: "/images/order-1.webp", maximum: 40 },
  { id: "dry", title: "Dry Cleaning", caption: "Suits, dresses, jackets and delicate pieces.", rate: 25, unit: "item", image: "/images/order-2.webp", maximum: 30 },
  { id: "iron", title: "Ironing & Pressing", caption: "Crisp, carefully pressed everyday garments.", rate: 12, unit: "item", image: "/images/order-3.webp", maximum: 30 },
  { id: "bedding", title: "Bedding & Household", caption: "Duvets, sheets, blankets and household linen.", rate: 30, unit: "item", image: "/images/order-1.webp", maximum: 30 },
];
const TIME_SLOTS = ["08:00–09:00", "09:00–10:00", "10:00–11:00", "11:00–12:00", "12:00–13:00", "13:00–14:00", "14:00–15:00", "15:00–16:00", "16:00–17:00"];
const STEP_LABELS = ["Service method", "Laundry services", "Date & time", "Location details", "Review & payment"];
const GH = (amount: number) => `GH₵ ${amount.toFixed(2)}`;
const initialCounts: Record<ServiceID, number> = { wash: 0, dry: 0, iron: 0, bedding: 0 };
const blankAddress: Address = { street: "", area: "", landmark: "" };
const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const isoLocal = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const prettyDate = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Not selected";
const isFutureDay = (d: Date) => d.getTime() >= today().getTime();

function BrandMark() { return <svg className={styles.mark} viewBox="0 0 46 46" fill="none" aria-hidden="true"><path d="M4 15c6-7 12-8 19-3 6 4 11 4 19-2M4 24c6-7 12-8 19-3 6 4 11 4 19-2M4 33c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.3" strokeLinecap="round"/></svg>; }
function FormHeader({number, title, subtitle}: {number:number;title:string;subtitle:string}) { return <div className={styles.sectionHeader}><span className={styles.roundNumber}>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function IconCircle({ icon: Icon }: {icon:LucideIcon}) {return <span className={styles.iconCircle}><Icon size={26} strokeWidth={1.85}/></span>;}
function Field({label, value, onChange, placeholder, required=false, multiline=false}: {label:string;value:string;onChange:(v:string)=>void;placeholder:string;required?:boolean;multiline?:boolean}) {return <label className={styles.field}><span>{label}{required&&<b aria-hidden="true"> *</b>}</span>{multiline?<textarea rows={3} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>:<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}/>}</label>;}

function MiniCalendar({ value, onChange, month, onMonth }: {value:string;onChange:(v:string)=>void;month:Date;onMonth:(d:Date)=>void}) {
  const first = new Date(month.getFullYear(),month.getMonth(),1);
  const mondayOffset = (first.getDay()+6)%7;
  const endDay = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const cellCount = Math.ceil((mondayOffset+endDay)/7)*7;
  const nowMonth = today(); nowMonth.setDate(1);
  return <div className={styles.calendarBox}>
    <div className={styles.calendarTop}><button type="button" onClick={()=>onMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} disabled={month.getTime()<=nowMonth.getTime()} aria-label="Previous month"><ChevronLeft size={18}/></button><strong>{month.toLocaleDateString("en-GB",{month:"long",year:"numeric"})}</strong><button type="button" onClick={()=>onMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} aria-label="Next month"><ChevronRight size={18}/></button></div>
    <div className={styles.calendarGrid}>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=><span key={day} className={styles.weekday}>{day}</span>)}
      {Array.from({length:cellCount},(_,index)=>{const day=new Date(month.getFullYear(),month.getMonth(),index-mondayOffset+1); const inMonth=day.getMonth()===month.getMonth(); const dateKey=isoLocal(day); const selectable=inMonth && isFutureDay(day); return <button key={`${index}-${dateKey}`} type="button" className={`${styles.day} ${value===dateKey?styles.daySelected:""} ${!inMonth?styles.dayOther:""}`} disabled={!selectable} onClick={()=>onChange(dateKey)} aria-label={day.toLocaleDateString("en-GB",{dateStyle:"full"})} aria-pressed={value===dateKey}>{day.getDate()}</button>})}
    </div>
  </div>;
}

const SIDEBAR: {label:string;icon:LucideIcon;href:string;active?:boolean}[] = [
  {label:"Dashboard",icon:House,href:"/dashboard"},
  {label:"Book a Pickup",icon:Truck,href:"/book-a-pickup",active:true},
  {label:"My Orders",icon:Package,href:"/my-orders"},
  {label:"Saved Addresses",icon:MapPin,href:"/saved-addresses"},
  {label:"Payments",icon:CreditCard,href:"/payments"},
  {label:"Account Settings",icon:UserRound,href:"/account-settings"},
  {label:"Support",icon:Headphones,href:"/support"},
];

export default function BookPickupPage() {
  const router=useRouter();
  const [step,setStep] = useState(1);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [method,setMethod] = useState<Method>("pickup");
  const [quantities,setQuantities] = useState<Record<ServiceID,number>>(initialCounts);
  const [selectedDate,setSelectedDate] = useState("");
  const [month,setMonth] = useState(() => new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [slot,setSlot] = useState("");
  const [phone,setPhone] = useState("");
  const [pickupAddress,setPickupAddress] = useState<Address>(blankAddress);
  const [deliveryAddress,setDeliveryAddress] = useState<Address>(blankAddress);
  const [sameAddress,setSameAddress] = useState(true);
  const [savedAddresses,setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [savedPayments,setSavedPayments] = useState<CustomerPayment[]>([]);
  const [addressesReady,setAddressesReady] = useState(false),[paymentsReady,setPaymentsReady] = useState(false);
  const [catalog,setCatalog] = useState<Service[]>(SERVICES);
  const [availableSlots,setAvailableSlots] = useState<string[]>(TIME_SLOTS);
  const [processing,setProcessing] = useState(false);
  async function logout(){try{await send('/auth/logout','POST');}finally{router.replace('/login');}}
  useEffect(()=>{
    api<Profile>('/me').then(u=>{if(u.role!=='customer')router.replace('/admin');else setPhone(v=>v||u.phone);}).catch(()=>router.replace('/login'));
    api<RemoteAddress[]>('/addresses').then(a=>setSavedAddresses(a.map(x=>({...x,id:String(x.id)})))).catch(()=>{}).finally(()=>setAddressesReady(true));
    api<RemotePayment[]>('/payment-methods').then(p=>setSavedPayments(p.map(x=>({...x,id:String(x.id)})))).catch(()=>{}).finally(()=>setPaymentsReady(true));
    api<RemoteService[]>('/services').then(s=>setCatalog(s.map(x=>({id:x.id as ServiceID,title:x.name,caption:x.description,rate:x.rate,unit:x.unit,image:x.image,maximum:40})))).catch(()=>{});
  },[router]);
  useEffect(()=>{if(!selectedDate)return;api<{slot:string;available:boolean}[]>(`/availability?day=${encodeURIComponent(selectedDate)}&method=${method}`).then(rows=>setAvailableSlots(rows.filter(r=>r.available).map(r=>r.slot))).catch(()=>setAvailableSlots([]));},[selectedDate,method]);
  const [selectedPickupId,setSelectedPickupId] = useState("");
  const [selectedDeliveryId,setSelectedDeliveryId] = useState("");
  const [selectedPaymentId,setSelectedPaymentId] = useState("");
  const [saveNewPickup,setSaveNewPickup] = useState(true);
  const [saveNewDelivery,setSaveNewDelivery] = useState(true);
  useEffect(()=>{if(addressesReady && !selectedPickupId && savedAddresses.length){
    const a=savedAddresses.find(a=>a.isDefault)||savedAddresses[0];
    setSelectedPickupId(a.id);setPickupAddress({street:a.street,area:a.area,landmark:a.instructions});setPhone(a.phone);
  }},[addressesReady,savedAddresses,selectedPickupId]);
  useEffect(()=>{if(paymentsReady && !selectedPaymentId && savedPayments.length){
   const m=savedPayments.find(m=>m.isDefault)||savedPayments[0];setSelectedPaymentId(m.id);
  }},[paymentsReady,savedPayments,selectedPaymentId]);
  function chooseSaved(which:"pickup"|"delivery",id:string){
    const a=savedAddresses.find(a=>a.id===id);const next=a?{street:a.street,area:a.area,landmark:a.instructions}:{...blankAddress};
    if(which==="pickup"){setSelectedPickupId(id);setPickupAddress(next);if(a)setPhone(a.phone);}
    else {setSelectedDeliveryId(id);setDeliveryAddress(next);}
  }
  async function createOptionalAddress(which:"pickup"|"delivery") {
    const selected=which==='pickup'?selectedPickupId:selectedDeliveryId;
    if(selected!=='new')return selected?Number(selected):null;
    const model=which==='pickup'?pickupAddress:deliveryAddress;
    const save=which==='pickup'?saveNewPickup:saveNewDelivery;
    if(!save)return null;
    const created=await send<RemoteAddress>('/addresses','POST',{label:which==='pickup'?'Pickup address':'Delivery address',street:model.street,area:model.area,region:'Greater Accra',phone,instructions:model.landmark,isDefault:false});
    return created.id;
  }
  function inlineAddress(which:'pickup'|'delivery'){
    const selected=which==='pickup'?selectedPickupId:selectedDeliveryId;
    const save=which==='pickup'?saveNewPickup:saveNewDelivery;
    if(selected!=='new'||save)return null;
    const a=which==='pickup'?pickupAddress:deliveryAddress;
    return {label:which==='pickup'?'One-time pickup':'One-time delivery',street:a.street,area:a.area,region:'Greater Accra',phone,instructions:a.landmark,isDefault:false};
  }
  const [storeChoice,setStoreChoice] = useState("sample-store");
  const [speed,setSpeed] = useState<Speed>("standard");
  const [instructions,setInstructions] = useState("");
  const [payment,setPayment] = useState<Payment>("later");
  const [errors,setErrors] = useState<string[]>([]);
  const [demoReference,setDemoReference] = useState("");

  const selections = catalog.filter(s=>quantities[s.id]>0);
  const itemCount = selections.reduce((sum,s)=>sum+quantities[s.id],0);
  const subtotal = selections.reduce((sum,s)=>sum+quantities[s.id]*s.rate,0);
  const expressFee = speed==="express" ? 15 : 0; // Explicitly illustrative, not a real charge.
  const total = subtotal+expressFee;
  const methodName = method==="pickup" ? "Pickup & Delivery" : "In-Store Drop-off";
  const canViewStep = (target:number) => target<=step;
  const completion = step===6;

  function validateCurrentStep(): string[] {
    if(step===4 && phone.replace(/\D/g,'').length<9)return ['Enter a valid contact phone number.'];
    if(step===2 && itemCount===0) return ["Add at least one laundry service to continue."];
    if(step===3 && !selectedDate) return ["Choose a date to continue."];
    if(step===3 && !slot) return ["Choose a time preference to continue."];
    if(step===4 && method==="pickup") {
      const messages:string[]=[];
      if(!phone.trim() || phone.replace(/\D/g,"").length<9) messages.push("Enter a valid contact phone number.");
      if(!pickupAddress.street.trim() || !pickupAddress.area.trim()) messages.push("Enter the pickup street and area.");
      if(!sameAddress && (!deliveryAddress.street.trim() || !deliveryAddress.area.trim())) messages.push("Enter your return-delivery street and area.");
      return messages;
    }
    return [];
  }
  function nextStep(){const faults=validateCurrentStep();if(faults.length){setErrors(faults);return;}setErrors([]);setStep(v=>Math.min(5,v+1));window.scrollTo({top:0,behavior:"smooth"});}
  function previous(){setErrors([]);setStep(v=>Math.max(1,v-1));window.scrollTo({top:0,behavior:"smooth"});}
  async function finish(){
    if(processing)return;setErrors([]);setProcessing(true);
    try{
      const pickupId=method==='pickup'?await createOptionalAddress('pickup'):null;
      const deliveryId=method==='pickup'?(sameAddress?pickupId:await createOptionalAddress('delivery')):null;
      const pickupNew=method==='pickup'?inlineAddress('pickup'):null;
      const deliveryNew=method==='pickup'?(sameAddress?pickupNew:inlineAddress('delivery')):null;
      const result=await send<LaundryOrder>('/orders','POST',{
        method,items:selections.map(s=>({serviceId:s.id,qty:quantities[s.id]})),pickupDate:selectedDate,pickupSlot:slot,
        pickupAddressId:pickupId,deliveryAddressId:deliveryId,pickupNew,deliveryNew,contactPhone:phone,
        speed,instructions,paymentChoice:payment==='online'?'online_demo':'later',paymentMethodId:payment==='online'&&selectedPaymentId?Number(selectedPaymentId):null,
      });
      setDemoReference(result.reference);setStep(6);window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setErrors([(e as Error).message]);}finally{setProcessing(false);}
  }
  function updateCount(id:ServiceID, delta:number){const svc=catalog.find(s=>s.id===id)!;setQuantities(q=>({...q,[id]:Math.min(svc.maximum,Math.max(0,q[id]+delta))}));setErrors([]);}
  function updateAddress(which:"pickup"|"delivery",key:keyof Address,value:string){const setter=which==="pickup"?setPickupAddress:setDeliveryAddress;setter(prev=>({...prev,[key]:value}));}
  const orderImage = useMemo(()=>catalog.find(s=>quantities[s.id]>0)?.image??"/images/order-1.webp",[quantities,catalog]);

  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${mobileOpen?styles.sidebarOpen:""}`}>
      <Link href="/dashboard" className={styles.brand}><BrandMark/><span><strong>Dee’s Laundromat</strong><small>GARMENT CARE, REIMAGINED.</small></span></Link>
      <button className={styles.closeSidebar} onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X size={21}/></button>
      <nav className={styles.nav}>{SIDEBAR.map(({label,icon:Icon,href,active})=><Link key={label} href={href} onClick={()=>setMobileOpen(false)} className={`${styles.navItem} ${active?styles.navActive:""}`} aria-current={active?"page":undefined}><Icon size={20} strokeWidth={2.05}/>{label}</Link>)}</nav>
      <button className={styles.logout} onClick={()=>void logout()}><LogOut size={21}/> Log out</button>
    </aside>
    {mobileOpen && <button className={styles.scrim} onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <div className={styles.main}>
      <header className={styles.topbar}>
        <button className={styles.menuButton} onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={23}/></button>
        <Link className={styles.backDashboard} href="/dashboard"><ArrowLeft size={17}/> Back to Dashboard</Link>
        <div className={styles.userControls}><button aria-label="Notifications are disabled in the sample" title="Demo notifications"><Bell size={22}/><span className={styles.redDot}/></button><span className={styles.avatar}>AM</span><span className={styles.userName}>Alex Mensah</span></div>
      </header>
      <div className={styles.container}>
      {!completion ? <>
        <div className={styles.pageHeading}>
          <div><span className={styles.eyebrow}>BOOK A PICKUP</span><h1>Book a Pickup</h1><p>A few simple steps to fresher laundry.</p></div>
          <div className={styles.progressWrap} aria-label={`Step ${step} of 5`}><span><strong>Step {step}</strong> of 5</span><div className={styles.progressTrack}>{STEP_LABELS.map((label,i)=><div title={label} key={label} className={`${styles.progressSegment} ${i<step?styles.progressFilled:""}`}/>)}</div></div>
        </div>
        <div className={styles.columns}>
          <section className={styles.formCard}>
            {step===1 && <>
              <FormHeader number={1} title="How would you like to use our service?" subtitle="Choose one option to begin your laundry booking."/>
              <div className={styles.methodGrid}>
                <button type="button" onClick={()=>setMethod("pickup")} aria-pressed={method==="pickup"} className={`${styles.methodCard} ${method==="pickup"?styles.selectedCard:""}`}><span className={styles.customRadio}/><IconCircle icon={Truck}/><div><h3>Pickup & Delivery</h3><span className={styles.recommended}>Recommended</span><p>We’ll collect your laundry from your address, care for it, and deliver it back to you.</p></div></button>
                <button type="button" onClick={()=>setMethod("store")} aria-pressed={method==="store"} className={`${styles.methodCard} ${method==="store"?styles.selectedCard:""}`}><span className={styles.customRadio}/><IconCircle icon={Store}/><div><h3>In-Store Drop-off</h3><p>Prefer to bring your clothes to us? Drop them off in-store and collect them when ready.</p></div></button>
              </div>
              <div className={styles.notice}><ShieldCheck size={21}/><div><strong>Every garment deserves thoughtful care.</strong><span>You'll select laundry services, a time, and location details in the next steps.</span></div></div>
            </>}
            {step===2 && <>
              <FormHeader number={2} title="What would you like us to clean?" subtitle="Add laundry services and estimated quantities. You can select more than one."/>
              <div className={styles.serviceGrid}>{catalog.map(service=><div key={service.id} className={`${styles.serviceCard} ${quantities[service.id]>0?styles.serviceSelected:""}`}>
                <img src={service.image} alt=""/><div className={styles.serviceInfo}><h3>{service.title}</h3><p>{service.caption}</p><strong>{GH(service.rate)} <span>/ {service.unit}{service.unit==="item"?"":""}</span></strong></div>
                {quantities[service.id]>0 ? <div className={styles.quantityControl}><button type="button" onClick={()=>updateCount(service.id,-1)} aria-label={`Remove one ${service.unit} of ${service.title}`}><Minus size={15}/></button><span>{quantities[service.id]} {service.unit}{service.unit==="item"&&quantities[service.id]>1?"s":""}</span><button type="button" onClick={()=>updateCount(service.id,1)} aria-label={`Add one ${service.unit} of ${service.title}`}><Plus size={15}/></button></div> : <button type="button" className={styles.addButton} onClick={()=>updateCount(service.id,1)}><Plus size={15}/> Add</button>}
              </div>)}</div>
              <div className={styles.notice}><Info size={21}/><div><strong>These are sample prices for the design prototype.</strong><span>Wash & Fold is estimated by weight; final prices may change once garments are checked and weighed. Adjustments require customer approval.</span></div></div>
            </>}
            {step===3 && <>
              <FormHeader number={3} title={method==="pickup"?"When should we collect your laundry?":"When do you plan to drop off?"} subtitle={method==="pickup"?"Choose a convenient collection date and preferred time window.":"Choose your intended visit date and time. Store hours will be confirmed later."}/>
              <div className={styles.calendarLayout}><MiniCalendar value={selectedDate} onChange={setSelectedDate} month={month} onMonth={setMonth}/><div className={styles.slotsBox}><div className={styles.slotsTop}><strong>Preferred time window</strong><small>{selectedDate?prettyDate(selectedDate):"Select a date first"}</small></div><div className={styles.slotGrid}>{TIME_SLOTS.map(s=><button type="button" key={s} disabled={!selectedDate || !availableSlots.includes(s)} className={`${styles.timeSlot} ${slot===s?styles.timeSelected:""}`} onClick={()=>setSlot(s)} aria-pressed={slot===s}>{s}</button>)}</div><p className={styles.timeNote}><Clock3 size={16}/> Ghana time (GMT). {method==="pickup"?"Slots reflect sample backend capacity; confirm operational availability before live launch.":"This is a visit preference, not a reserved appointment."}</p></div></div>
              <div className={styles.notice}><Info size={21}/><div><strong>{method==="pickup"?"Scheduling confirmation comes later.":"In-store drop-off doesn't require a rider."}</strong><span>{method==="pickup"?"The business must confirm collection capacity before accepting a real booking.":"You’ll select a sample branch in the next step. Actual branch hours are not yet configured."}</span></div></div>
            </>}
            {step===4 && <>
              <FormHeader number={4} title={method==="pickup"?"Where should we collect your laundry?":"Choose your drop-off location"} subtitle={method==="pickup"?"Tell us where the rider should come and where to return your clothes.":"Select a store and add any instructions for your drop-off."}/>
              {method==="pickup"?<div className={styles.addressForm}>
                <div className={styles.subsectionTitle}><MapPin size={18}/><h3>Choose a saved pickup address</h3></div>
                <div className={styles.savedAddressGrid}>{savedAddresses.map(a=><button key={a.id} type="button" aria-pressed={selectedPickupId===a.id} className={`${styles.savedAddress} ${selectedPickupId===a.id?styles.savedSelected:""}`} onClick={()=>chooseSaved("pickup",a.id)}><House size={20}/><span><strong>{a.label} {a.isDefault?"· Default":""}</strong><small>{a.street}, {a.area}</small></span>{selectedPickupId===a.id&&<CheckCircle2 size={18}/>}</button>)}<button type="button" className={`${styles.savedAddress} ${selectedPickupId==="new"?styles.savedSelected:""}`} onClick={()=>chooseSaved("pickup","new")}><Plus size={20}/><span><strong>Use a new pickup address</strong><small>Enter it once and optionally save it</small></span></button></div>
                {selectedPickupId==="new"&&<><div className={styles.formGrid}><Field label="Street / building" value={pickupAddress.street} onChange={v=>updateAddress("pickup","street",v)} placeholder="House number, street or building" required/><Field label="Area / neighbourhood" value={pickupAddress.area} onChange={v=>updateAddress("pickup","area",v)} placeholder="e.g. East Legon" required/><Field label="Landmark / extra directions" value={pickupAddress.landmark} onChange={v=>updateAddress("pickup","landmark",v)} placeholder="Gate, floor or nearby landmark"/></div><label className={styles.checkboxLine}><input type="checkbox" checked={saveNewPickup} onChange={e=>setSaveNewPickup(e.target.checked)}/> Save this address for next time</label></>}
                <div className={styles.formGrid}><Field label="Contact phone" value={phone} onChange={setPhone} placeholder="e.g. +233 24 123 4567" required/></div>
                <label className={styles.checkboxLine}><input type="checkbox" checked={sameAddress} onChange={e=>setSameAddress(e.target.checked)}/><span>Deliver my clean clothes to the same address</span></label>
                {!sameAddress&&<><div className={styles.subsectionTitle}><Truck size={18}/><h3>Choose a return delivery address</h3></div>
                <div className={styles.savedAddressGrid}>{savedAddresses.map(a=><button key={a.id} type="button" aria-pressed={selectedDeliveryId===a.id} className={`${styles.savedAddress} ${selectedDeliveryId===a.id?styles.savedSelected:""}`} onClick={()=>chooseSaved("delivery",a.id)}><MapPin size={20}/><span><strong>{a.label}</strong><small>{a.street}, {a.area}</small></span>{selectedDeliveryId===a.id&&<CheckCircle2 size={18}/>}</button>)}<button type="button" className={`${styles.savedAddress} ${selectedDeliveryId==="new"?styles.savedSelected:""}`} onClick={()=>chooseSaved("delivery","new")}><Plus size={20}/><span><strong>New delivery location</strong><small>Enter another address</small></span></button></div>
                {selectedDeliveryId==="new"&&<><div className={styles.formGrid}><Field label="Street / building" required value={deliveryAddress.street} onChange={v=>updateAddress("delivery","street",v)} placeholder="Delivery street or building"/><Field label="Area / neighbourhood" required value={deliveryAddress.area} onChange={v=>updateAddress("delivery","area",v)} placeholder="Delivery area"/><Field label="Landmark (optional)" value={deliveryAddress.landmark} onChange={v=>updateAddress("delivery","landmark",v)} placeholder="Directions for the rider"/></div><label className={styles.checkboxLine}><input type="checkbox" checked={saveNewDelivery} onChange={e=>setSaveNewDelivery(e.target.checked)}/> Save this delivery address for future orders</label></>}
                </>}
                <div className={styles.notice}><MapPin size={19}/><div><strong>Saved addresses make repeat bookings faster.</strong><span>Choose an address above instead of retyping. Live maps and coverage checks will be added with the backend.</span></div></div>
              </div>:<div className={styles.storeOptions}><button type="button" className={`${styles.storeCard} ${storeChoice==="sample-store"?styles.selectedCard:""}`} onClick={()=>setStoreChoice("sample-store")}><IconCircle icon={Store}/><div><h3>Dee’s Sample Branch</h3><p>Location and hours will be provided once the real business details are available.</p><span className={styles.recommended}>Design placeholder</span></div><CheckCircle2 size={19}/></button><div className={styles.notice}><Info size={19}/><div><strong>In-store ordering is a sample workflow.</strong><span>This does not reserve an appointment or identify a real store location.</span></div></div></div>}
              <Field label="Special instructions (optional)" multiline value={instructions} onChange={setInstructions} placeholder="Care notes, stain details, or collection instructions"/>
            </>}
            {step===5 && <>
              <FormHeader number={5} title="Review your booking" subtitle="Choose your turnaround and payment preference, then review everything."/>
              <div className={styles.reviewGrid}><div><h3>Turnaround</h3><div className={styles.choiceGroup}><button type="button" className={`${styles.choice} ${speed==="standard"?styles.choiceSelected:""}`} onClick={()=>setSpeed("standard")}><Clock3 size={23}/><div><strong>Standard care</strong><span>Regular turnaround · no rush fee</span></div>{speed==="standard"&&<CheckCircle2 size={19}/>}</button><button type="button" className={`${styles.choice} ${speed==="express"?styles.choiceSelected:""}`} onClick={()=>setSpeed("express")}><Sparkles size={23}/><div><strong>Express care</strong><span>Faster service if available · demo +{GH(15)}</span></div>{speed==="express"&&<CheckCircle2 size={19}/>}</button></div></div><div><h3>Payment preference</h3><div className={styles.choiceGroup}><button type="button" className={`${styles.choice} ${payment==="later"?styles.choiceSelected:""}`} onClick={()=>setPayment("later")}><Wallet size={22}/><div><strong>Pay later</strong><span>Pay after pricing is confirmed</span></div>{payment==="later"&&<CheckCircle2 size={19}/>}</button><button type="button" className={`${styles.choice} ${payment==="online"?styles.choiceSelected:""}`} onClick={()=>setPayment("online")}><CreditCard size={22}/><div><strong>Pay online</strong><span>Test payment only · no actual charge</span></div>{payment==="online"&&<CheckCircle2 size={19}/>}</button></div></div></div>
              {payment==="online"&&<div className={styles.savedPaymentPanel}><h3>Choose a saved payment method</h3><div className={styles.savedAddressGrid}>{savedPayments.map(m=><button type="button" key={m.id} onClick={()=>setSelectedPaymentId(m.id)} className={`${styles.savedAddress} ${selectedPaymentId===m.id?styles.savedSelected:""}`}><CreditCard size={19}/><span><strong>{m.kind==="momo"?(m.provider||"Mobile Money"):(m.kind==="visa"?"Visa":"Mastercard")} •••• {m.last4}</strong><small>{m.isDefault?"Default payment method":"Saved payment method"}</small></span>{selectedPaymentId===m.id&&<CheckCircle2 size={17}/>}</button>)}</div><p style={{fontSize:12,color:"#7590a8"}}>No actual payment will be processed in test mode. <Link href="/payments">Manage payment methods</Link></p></div>}
              <div className={styles.reviewBox}><h3>Your booking details</h3><div><span>Service method</span><strong>{methodName}</strong></div><div><span>Services</span><strong>{selections.map(s=>`${s.title} × ${quantities[s.id]}`).join(", ")}</strong></div><div><span>{method==="pickup"?"Pickup window":"Drop-off preference"}</span><strong>{prettyDate(selectedDate)} · {slot}</strong></div><div><span>{method==="pickup"?"Pickup location":"Store"}</span><strong>{method==="pickup"?`${pickupAddress.street}, ${pickupAddress.area}`:"Dee’s Sample Branch (placeholder)"}</strong></div>{method==="pickup"&&!sameAddress&&<div><span>Delivery location</span><strong>{deliveryAddress.street}, {deliveryAddress.area}</strong></div>}<div><span>Turnaround</span><strong>{speed==="express"?"Express":"Standard"}</strong></div><div><span>Payment</span><strong>{payment==="online"?"Online (demo)":"Pay later"}</strong></div><div><span>Estimated total</span><strong>{GH(total)}</strong></div></div>
              <div className={styles.notice}><Info size={21}/><div><strong>Your booking will be saved.</strong><span>A real record will be created in the test database and appear in My Orders. Online payment is simulated; no money will be taken and no rider is dispatched.</span></div></div>
            </>}
            {errors.length>0&&<div className={styles.errors} role="alert">{errors.map(error=><p key={error}>{error}</p>)}</div>}
            <div className={styles.actionRow}>{step>1?<button type="button" className={styles.secondaryBtn} onClick={previous}><ArrowLeft size={17}/> Previous</button>:<span className={styles.tip}>You can return and adjust your choices.</span>}
              {step<5?<button type="button" className={styles.primaryBtn} onClick={nextStep}>Continue to {step===1?"Laundry Services":step===2?"Date & Time":step===3?"Location Details":"Review & Payment"}<ArrowRight size={18}/></button>:<button type="button" className={styles.primaryBtn} onClick={finish}>{processing?"Saving booking…":"Confirm Booking"} <Check size={18}/></button>}</div>
          </section>
          <aside className={styles.summaryCard}>
            <div className={styles.summaryTop}><h2>Your Order</h2><span>{itemCount} {itemCount===1?"unit":"units"}</span></div>
            {itemCount===0?<div className={styles.emptyState}><span><Package size={46} strokeWidth={1.45}/></span><strong>No items added yet</strong><p>Your selected laundry services will appear here.</p></div>:<div className={styles.orderItems}>{selections.map(s=><div key={s.id} className={styles.orderLine}><img src={s.image} alt=""/><div><strong>{s.title}</strong><small>{quantities[s.id]} {s.unit}{s.unit==="item"&&quantities[s.id]>1?"s":""}</small></div><b>{GH(quantities[s.id]*s.rate)}</b></div>)}</div>}
            <div className={styles.summaryRule}/><h3>Booking Details</h3>
            <div className={styles.summaryDetail}><Truck size={18}/><div><strong>Service method</strong><span>{methodName}</span></div></div>
            <div className={styles.summaryDetail}><CalendarDays size={18}/><div><strong>{method==="pickup"?"Pickup date & time":"Drop-off preference"}</strong><span>{selectedDate?`${prettyDate(selectedDate)}${slot?` · ${slot}`:""}`:"Not selected"}</span></div></div>
            <div className={styles.summaryDetail}><MapPin size={18}/><div><strong>{method==="pickup"?"Pickup address":"Store location"}</strong><span>{method==="store"?"Dee’s Sample Branch (placeholder)":pickupAddress.street?`${pickupAddress.street}, ${pickupAddress.area}`:"Not selected"}</span></div></div>
            <div className={styles.summaryDetail}><Clock3 size={18}/><div><strong>Turnaround</strong><span>{speed==="express"?"Express (demo fee)":"Standard"}</span></div></div>
            <div className={styles.summaryRule}/><div className={styles.totalRow}><span>Estimated total</span><strong>{GH(total)}</strong></div><p className={styles.summaryDisclaimer}>Illustrative pricing only. Final amount may change after items are weighed or inspected.</p>
            {step<5&&<div className={styles.summaryTip}><Info size={18}/><span>Step {step} of 5 · {STEP_LABELS[step-1]}</span></div>}
          </aside>
        </div>
        </> : <section className={styles.confirmation}><span className={styles.confirmIcon}><CheckCircle2 size={50}/></span><span className={styles.eyebrow}>BOOKING SAVED</span><h1>Your booking is confirmed in the test system.</h1><p>Your order is now available in My Orders. No real rider has been dispatched.</p><div className={styles.confirmDetails}><div><span>Order reference</span><strong>{demoReference}</strong></div><div><span>Booking method</span><strong>{methodName}</strong></div><div><span>{method==="pickup"?"Preferred collection":"Preferred visit"}</span><strong>{prettyDate(selectedDate)} · {slot}</strong></div><div><span>Estimated total</span><strong>{GH(total)}</strong></div></div><div className={styles.confirmWarning}><Info size={21}/><span>Test mode: this order exists in the backend database, but collection and any online payment are simulated.</span></div><div className={styles.confirmActions}><button className={styles.secondaryBtn} onClick={()=>{setStep(1);setDemoReference("");}}>Start again</button><Link className={styles.primaryBtn} href="/dashboard">View dashboard <ArrowRight size={17}/></Link></div></section>}
        <footer className={styles.prototypeFoot}>Dee’s Laundromat · Test environment · Pricing and available slots are sample data. No live payments.</footer>
      </div>
    </div>
  </div>;
}
