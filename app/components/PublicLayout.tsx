import Link from 'next/link';
import type {ReactNode} from 'react';
import styles from './public.module.css';
export {styles as publicStyles};
export function PublicLayout({children}:{children:ReactNode}){
 return <div className={styles.site}><header className={styles.header}><Link href="/" className={styles.logo}>≋ Dee’s Laundromat<small>GARMENT CARE, REIMAGINED.</small></Link><nav className={styles.links} aria-label="Main navigation"><Link href="/">Home</Link><Link href="/services">Services & Pricing</Link><Link href="/how-it-works">How It Works</Link><Link href="/about">About</Link><Link href="/locations">Locations</Link><Link href="/faq">FAQ</Link><Link href="/login">Log in</Link><Link className={styles.primary} href="/book-a-pickup">Book Pickup</Link></nav></header>{children}
 <footer className={styles.footer}><div className={styles.footerGrid}><div><h3>Dee’s Laundromat</h3><p>Thoughtful care for everything you wear.<br/>Pickup & delivery or in-store laundry care.</p></div><div><h3>Explore</h3><Link href="/services">Services & pricing</Link><Link href="/how-it-works">How it works</Link><Link href="/about">About Us</Link><Link href="/corporate">Business Services</Link></div><div><h3>Help</h3><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div><small>© {new Date().getFullYear()} Dee’s Laundromat. Sample brand and business details, for testing only.</small></footer></div>;
}
