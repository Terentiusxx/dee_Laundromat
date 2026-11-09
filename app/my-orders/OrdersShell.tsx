"use client";
import {useState,useEffect, type ReactNode} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import { Bell, CalendarDays, CreditCard, Headphones, House, LogOut, MapPin, Menu, Package, Truck, UserRound, X, ChevronDown } from "lucide-react";
import styles from "./orders.module.css";
import {api,send,type Profile} from "../lib/api";

const navigation = [
  {label:"Dashboard",icon:House,url:"/dashboard"},
  {label:"Book a Pickup",icon:Truck,url:"/book-a-pickup"},
  {label:"My Orders",icon:CalendarDays,url:"/my-orders"},
  {label:"Saved Addresses",icon:MapPin,url:"/saved-addresses"},
  {label:"Payments",icon:CreditCard,url:"/payments"},
  {label:"Account Settings",icon:UserRound,url:"/account-settings"},
  {label:"Support",icon:Headphones,url:"/support"},
];

function Brand() {
  return <Link href="/dashboard" className={styles.brand} aria-label="Dee's Laundromat dashboard">
    <svg viewBox="0 0 46 46" fill="none" aria-hidden="true"><path d="M4 15c6-7 12-8 19-3 6 4 11 4 19-2M4 24c6-7 12-8 19-3 6 4 11 4 19-2M4 33c6-7 12-8 19-3 6 4 11 4 19-2" stroke="currentColor" strokeWidth="4.3" strokeLinecap="round" /></svg>
    <span><strong>Dee’s Laundromat</strong><small>GARMENT CARE, REIMAGINED.</small></span>
  </Link>;
}

export function OrdersShell({children}:{children:ReactNode}) {
  const pathname=usePathname();const router=useRouter();
  const [profile,setProfile]=useState<Profile|null>(null);
  const [authLoading,setAuthLoading]=useState(true);
  useEffect(()=>{let active=true;api<Profile>("/me").then(u=>{if(!active)return;if(u.role==="admin"){router.replace("/admin");return;}setProfile(u);}).catch(()=>{if(active)router.replace("/login");}).finally(()=>{if(active)setAuthLoading(false);});return()=>{active=false;};},[router]);
  async function logout(){try{await send("/auth/logout","POST");}finally{router.replace("/login");}}
  const initials=(profile?.name||"Guest").split(/\s+/).map(w=>w[0]||"").slice(0,2).join("").toUpperCase()||"DL";
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
      <Brand/>
      <button className={styles.sidebarDismiss} aria-label="Close menu" onClick={()=>setSidebarOpen(false)}><X size={20}/></button>
      <nav className={styles.navigation} aria-label="Customer navigation">
        {navigation.map(({label,icon:Icon,url})=><Link key={label} href={url} onClick={()=>setSidebarOpen(false)} className={`${styles.navLink} ${(pathname===url || pathname.startsWith(url+"/"))?styles.navSelected:""}`} aria-current={(pathname===url || pathname.startsWith(url+"/"))?"page":undefined}><Icon size={22} strokeWidth={2.15}/><span>{label}</span></Link>)}
      </nav>
      <button className={styles.logout} onClick={logout}><LogOut size={23}/> Log out</button>
    </aside>
    {sidebarOpen&&<button className={styles.mobileOverlay} onClick={()=>setSidebarOpen(false)} aria-label="Close navigation"/>}
    <div className={styles.workspace}>
      <header className={styles.topbar}>
        <button className={styles.hamburger} onClick={()=>setSidebarOpen(true)} aria-label="Open menu"><Menu size={23}/></button>
        <span className={styles.topbarSpacer}/>
        <div className={styles.topAction}>
          <button className={styles.bell} onClick={()=>{setNotificationsOpen(v=>!v);setProfileOpen(false)}} aria-expanded={notificationsOpen} aria-label="Notifications"><Bell size={20}/><span/></button>
          {notificationsOpen&&<div className={styles.smallPopover} role="status">Notifications will appear here once your account is connected.</div>}
        </div>
        <div className={styles.topAction}>
          <button className={styles.profile} onClick={()=>{setProfileOpen(v=>!v);setNotificationsOpen(false)}} aria-expanded={profileOpen} aria-label="Account menu"><span className={styles.avatar}>{initials}</span><span className={styles.profileName}>{profile?.name||"Account"}</span><ChevronDown size={15}/></button>
          {profileOpen&&<div className={styles.smallPopover}><Link href="/account-settings">Account settings</Link><button onClick={logout}>Log out</button></div>}
        </div>
      </header>
      <main className={styles.pageContent}>{authLoading?<p style={{padding:28,color:"#627b91"}}>Loading your account…</p>:children}</main>
    </div>
  </div>;
}
