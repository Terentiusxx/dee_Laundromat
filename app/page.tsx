import Link from 'next/link';
import {ArrowRight, Truck, ShieldCheck, Zap, Leaf, Shirt, Sparkles, Layers3, BedDouble, CalendarDays, WashingMachine, PackageCheck, Clock3, HeartHandshake, Store, Check, MapPin, Instagram, Facebook, Mail, Menu, ChevronDown, ArrowUpRight} from 'lucide-react';
import styles from './home.module.css';

const services = [
  {title:'Everyday Laundry',desc:'Wash, dry and fold for your daily essentials.',image:'/images/home-everyday.webp',Icon:Shirt},
  {title:'Dry Cleaning',desc:'Gentle, professional care for delicate garments.',image:'/images/home-dry-cleaning.webp',Icon:Sparkles},
  {title:'Special Care',desc:'Thoughtful treatment for suits, fabrics and more.',image:'/images/home-special-care.webp',Icon:Layers3},
  {title:'Linen & Bedding',desc:'Refresh sheets, duvets, towels and household linens.',image:'/images/home-bedding.webp',Icon:BedDouble},
];
const faqs = [
  {q:'How does pickup and delivery work?',a:'Choose your laundry services, add a collection address, and select an available pickup window. Once your items are cleaned, you can follow the order through to delivery.'},
  {q:'What types of items can you clean?',a:'The sample service catalogue includes wash and fold, dry cleaning, ironing and pressing, bedding, and selected specialty items. Actual availability will be confirmed by the business.'},
  {q:'How long will my laundry take?',a:'The booking flow offers standard and express care options. Available turnaround windows and any express fees are shown during checkout.'},
  {q:'Can I visit a store instead?',a:'Yes. Choose in-store drop-off during booking or visit the Locations page for the store details once they are confirmed.'},
  {q:'Can I pay later?',a:'Yes. The sample booking experience offers a pay-later option as well as test-mode online payment. Payment terms will be finalized before launch.'},
];
function Logo({light=false}:{light?:boolean}){return <Link href="/" className={`${styles.logo} ${light?styles.logoLight:''}`} aria-label="Dee’s Laundromat — Home"><span className={styles.logoMark}>≋</span><span className={styles.logoWords}><strong>Dee’s Laundromat</strong><small>GARMENT CARE, REIMAGINED.</small></span></Link>}
export default function HomePage(){return <div className={styles.site}>
  <div className={styles.darkMasthead}>
    <header className={styles.header}>
      <Logo light/>
      <nav className={styles.nav} aria-label="Main navigation"><Link className={styles.active} href="/">Home</Link><Link href="/services">Services</Link><Link href="/services">Pricing</Link><Link href="/how-it-works">How It Works</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav>
      <div className={styles.navActions}><Link href="/login" className={styles.login}>Log In</Link><Link href="/book-a-pickup" className={styles.bookTop}>Book a Pickup <ArrowRight size={16}/></Link></div>
      <details className={styles.mobileMenu}><summary aria-label="Open navigation"><Menu size={24}/></summary><nav><Link href="/">Home</Link><Link href="/services">Services & Pricing</Link><Link href="/how-it-works">How It Works</Link><Link href="/about">About</Link><Link href="/locations">Locations</Link><Link href="/contact">Contact</Link><Link href="/login">Log In</Link><Link href="/book-a-pickup">Book a Pickup</Link></nav></details>
    </header>
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.heroPhoto} role="img" aria-label="Carefully folded white and navy towels beside a Dee's Laundromat laundry bag"/>
      <div className={styles.heroInner}><div className={styles.heroCopy}>
        <p className={styles.kicker}>PICKUP · WASH · CARE · DELIVERY</p>
        <h1 id="home-title">Fresh Laundry,<br/>Without the Hassle.</h1>
        <p className={styles.heroLead}>Professional laundry and garment care with convenient pickup and delivery, right to your door.</p>
        <div className={styles.heroActions}><Link href="/book-a-pickup" className={styles.whiteButton}>Book a Pickup <ArrowRight size={19}/></Link><Link href="/how-it-works" className={styles.outlineButton}>How It Works <ArrowRight size={17}/></Link></div>
      </div></div>
    </section>
  </div>
  <main>
    <section id="services" className={`${styles.section} ${styles.servicesSection}`}>
      <div className={styles.sectionTop}><div><p className={styles.sectionKicker}>WHAT WE DO</p><h2>Our Services</h2><p className={styles.sectionIntro}>From everyday laundry to specialized care, we keep your garments looking their best.</p></div><Link href="/services" className={styles.textLink}>View All Services <ArrowRight size={18}/></Link></div>
      <div className={styles.serviceGrid}>{services.map(({title,desc,image,Icon})=><Link href="/services" className={styles.serviceCard} key={title} style={{backgroundImage:`linear-gradient(180deg,rgba(8,24,42,.03) 5%,rgba(7,20,38,.88) 100%),url('${image}')`}}><span className={styles.serviceIcon}><Icon size={23}/></span><div><h3>{title}</h3><p>{desc}</p></div><ArrowUpRight className={styles.serviceArrow} size={19}/></Link>)}</div>
    </section>
    <section className={`${styles.section} ${styles.howSection}`}>
      <div className={styles.howHeading}><p className={styles.sectionKicker}>SIMPLE & CONVENIENT</p><h2>How It Works</h2><p>Clean clothes in three easy steps.</p></div>
      <div className={styles.howGrid}><div className={styles.howCard}><span><CalendarDays/></span><strong>1. Book a Pickup</strong><p>Choose a service and a time that works for you.</p></div><ArrowRight className={styles.howArrow}/><div className={styles.howCard}><span><WashingMachine/></span><strong>2. We Clean & Care</strong><p>We wash, clean and handle your items with care.</p></div><ArrowRight className={styles.howArrow}/><div className={styles.howCard}><span><Truck/></span><strong>3. Delivered to You</strong><p>Receive your fresh laundry back at your doorstep.</p></div></div>
    </section>
    <section className={`${styles.section} ${styles.whySection}`}><div className={styles.whyImage} role="img" aria-label="Crisp freshly folded garments"/><div className={styles.whyCopy}><p className={styles.sectionKicker}>THE DEE’S DIFFERENCE</p><h2>Why Choose Us</h2><p className={styles.whyLead}>More than clean clothes; a simpler laundry experience built around your routine.</p><div className={styles.whyGrid}><div><ShieldCheck/><span><strong>Thoughtful Care</strong><small>Careful treatment for the garments you love.</small></span></div><div><Clock3/><span><strong>Time-Saving</strong><small>Skip the laundry routine and reclaim your day.</small></span></div><div><Leaf/><span><strong>Garment-Focused</strong><small>Select services that suit your fabrics and items.</small></span></div><div><HeartHandshake/><span><strong>Here to Help</strong><small>Reach support from your customer account.</small></span></div></div></div></section>
    <section className={`${styles.section} ${styles.serviceModes}`}><div className={styles.modeIntro}><p className={styles.sectionKicker}>MORE WAYS TO LAUNDRY</p><h2>Pickup & Delivery<br/>or In-Store.</h2><p>Choose the laundry experience that fits your routine.</p></div><div className={styles.modeCard}><div className={styles.modePicOne}/><div className={styles.modeContent}><Truck/><h3>Pickup & Delivery</h3><p>Convenient, door-to-door laundry service on your schedule.</p><Link href="/book-a-pickup">Book a Pickup <ArrowRight size={16}/></Link></div></div><div className={styles.modeCard}><div className={styles.modePicTwo}/><div className={styles.modeContent}><Store/><h3>In-Store Service</h3><p>Prefer dropping off in person? Choose our in-store option.</p><Link href="/locations">Store Information <ArrowRight size={16}/></Link></div></div></section>
    <section className={`${styles.section} ${styles.faqSection}`}><div><p className={styles.sectionKicker}>COMMON QUESTIONS</p><h2>Frequently Asked<br/>Questions</h2><p>Quick answers to the things people ask most often.</p><Link className={styles.textLink} href="/faq">View all FAQs <ArrowRight size={17}/></Link></div><div className={styles.faqList}>{faqs.map(({q,a})=><details key={q} className={styles.faqItem}><summary>{q}<ChevronDown size={19}/></summary><p>{a}</p></details>)}</div></section>
    <section className={styles.finalCta}><div><p className={styles.sectionKicker}>READY FOR A FRESH START?</p><h2>Ready for Fresher, Cleaner Laundry?</h2><p>Book a pickup today and leave the laundry to us.</p><div className={styles.heroActions}><Link className={styles.whiteButton} href="/book-a-pickup">Book a Pickup <ArrowRight size={17}/></Link><Link className={styles.outlineButton} href="/how-it-works">How It Works <ArrowRight size={17}/></Link></div></div><div className={styles.ctaPhoto}/></section>
  </main>
  <footer className={styles.footer}><div className={styles.footerGrid}><div className={styles.footerBrand}><Logo light/><p>Laundry and garment care with flexible pickup, delivery and in-store service.</p><div className={styles.footerSocials}><Instagram/><Facebook/></div></div><div><h3>Quick Links</h3><Link href="/">Home</Link><Link href="/services">Services & Pricing</Link><Link href="/how-it-works">How It Works</Link><Link href="/book-a-pickup">Book a Pickup</Link></div><div><h3>Company</h3><Link href="/about">About Us</Link><Link href="/corporate">For Business</Link><Link href="/faq">FAQ</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></div><div><h3>Get in Touch</h3><Link href="/contact"><Mail size={16}/> Contact Us</Link><Link href="/locations"><MapPin size={16}/> Store Locations</Link><p>Contact details will be added when confirmed.</p></div></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Dee’s Laundromat. Concept brand · sample details.</span><span>GARMENT CARE, REIMAGINED.</span></div></footer>
</div>}
