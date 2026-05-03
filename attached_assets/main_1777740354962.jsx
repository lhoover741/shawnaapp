import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, X, ArrowRight, CalendarCheck, Sparkles, Star, MessageCircle, CheckCircle2 } from 'lucide-react';
import './styles.css';
import { SERVICES, ADD_ONS, BRAND_RULES, APPROVED_REVIEWS, GALLERY_IMAGES } from './data/services';
import { calculateBookingEstimate, buildSmsBookingText, buildSmsQuestionText } from './utils/bookingLogic';
import hero1 from './assets/images/hero-1.jpg';
import hero2 from './assets/images/hero-2.jpg';
import style1 from './assets/images/style-1.jpg';
import client1 from './assets/images/client-1.jpg';
import braids1 from './assets/images/braids-1.jpg';
import braids2 from './assets/images/braids-2.jpg';
import img3482 from './assets/images/IMG_3482.jpeg';

const imgMap = { hero1, hero2, style1, client1, braids1, braids2, img3482 };
const pages = ['Home', 'Gallery', 'Services', 'About', 'Booking', 'Reviews', 'Contact', 'Policies'];

function Header({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const go = (p) => { setPage(p); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <header className="site-header">
    <button className="brand" onClick={() => go('Home')} aria-label="Ravishing Beauté home">
      <span className="brand-mark">RB</span><span>Ravishing Beauté</span>
    </button>
    <nav className="desktop-nav">{pages.map(p => <button key={p} onClick={() => go(p)} className={page===p?'active':''}>{p}</button>)}</nav>
    <button className="menu-btn" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    {open && <nav className="mobile-nav">{pages.map(p => <button key={p} onClick={() => go(p)} className={page===p?'active':''}>{p}</button>)}</nav>}
  </header>;
}

function Footer({ setPage }) {
  return <footer className="footer">
    <div><div className="brand footer-brand"><span className="brand-mark">RB</span><span>Ravishing Beauté</span></div><p>Premium braids, installs, ponytails, and polished styling by appointment.</p></div>
    <div><h4>Hours</h4><p>Tue-Sat<br/>8:30 AM - 6:00 PM<br/>Closed Sunday & Monday</p></div>
    <div><h4>Book</h4><p>$25 deposit required.<br/>Same-day appointments by approval only.</p><button onClick={()=>setPage('Booking')} className="text-link">Request booking</button></div>
  </footer>;
}

function Hero({ setPage }) {
  return <section className="hero">
    <div className="hero-copy">
      <p className="eyebrow">Calumet City / NWI • By appointment</p>
      <h1>Polished hair styling with clean parts, consistency, and a premium finish.</h1>
      <p className="lede">At Ravishing Beauté, we focus on detail, neatness, and a client experience that feels organized from booking to final look.</p>
      <div className="actions"><button className="primary" onClick={()=>setPage('Booking')}>Request Appointment <ArrowRight size={18}/></button><button className="secondary" onClick={()=>setPage('Services')}>View Services</button></div>
      <div className="trust-strip"><span><CheckCircle2/> $25 deposit</span><span><CheckCircle2/> Hair included for select natural braiding colors</span><span><CheckCircle2/> Appointment-only</span></div>
    </div>
    <div className="hero-gallery">
      <img src={hero1}/><img src={style1}/><img src={hero2}/>
    </div>
  </section>;
}

function Home({ setPage }) {
  return <main><Hero setPage={setPage}/>
    <section className="section split"><div><p className="eyebrow">The Ravishing Beauté standard</p><h2>Clean, intentional, and finished with care.</h2><p>We keep the experience simple: clear services, clear pricing, clean policies, and a finished style that photographs beautifully.</p></div><div className="feature-card"><Sparkles/><h3>Premium without the clutter</h3><p>Every page and booking step is built around what clients need most: style clarity, policy confidence, and an easy way to request an appointment.</p></div></section>
    <section className="section"><div className="section-head"><div><p className="eyebrow">Featured Work</p><h2>Recent looks</h2></div><button className="secondary" onClick={()=>setPage('Gallery')}>Open Gallery</button></div><div className="work-grid featured"><img src={braids1}/><img src={client1}/><img src={braids2}/></div></section>
    <section className="section reviews-preview"><div className="section-head"><div><p className="eyebrow">Client words</p><h2>Approved reviews</h2></div><button className="secondary" onClick={()=>setPage('Reviews')}>See All Reviews</button></div><div className="cards">{APPROVED_REVIEWS.slice(0,3).map((r,i)=><ReviewCard r={r} key={i}/>)}</div></section>
  </main>;
}

function Gallery() { return <main className="section page"><p className="eyebrow">Gallery</p><h1>Editorial-style gallery</h1><p className="page-intro">A curated photo experience for Ravishing Beauté work. Prioritize the strongest finished looks and keep the layout clean on mobile.</p><div className="masonry">{GALLERY_IMAGES.map((g,i)=><figure className={i===0||i===3?'large':''} key={g.src}><img src={imgMap[g.src]}/><figcaption>{g.caption}</figcaption></figure>)}</div></main>; }

function Services({ setPage }) { return <main className="section page"><p className="eyebrow">Services / Pricing</p><h1>Salon menu</h1><p className="page-intro">Pricing is organized to make booking clear. Final timing and approval may vary based on style size, length, density, and add-ons.</p><div className="service-list">{SERVICES.map(s=><article className="service-card" key={s.id}><div><h3>{s.name}</h3><p>{s.description}</p>{s.hairIncluded && <span className="pill">Hair included: 1, 1B, 2, 4</span>}</div><div className="price">${s.basePrice}+</div></article>)}</div><div className="rule-box"><h3>Booking Rules</h3>{BRAND_RULES.map(r=><p key={r}>• {r}</p>)}</div><button className="primary" onClick={()=>setPage('Booking')}>Start Booking Request</button></main>; }

function About() { return <main className="section page about-grid"><div><p className="eyebrow">About Your Stylist</p><h1>Hi, I’m Shawna.</h1><p>I’ve been styling since 2016, starting by practicing on friends and family and growing my skills through braids, ponytails, quick weaves, and polished protective styles.</p><p>I graduated cosmetology school in 2023, and my focus now is consistency, clean parts, and finished results that feel neat, confident, and beautiful.</p><p>Ravishing Beauté is built around care, detail, and a smooth appointment experience from start to finish.</p></div><img className="portrait" src={img3482}/></main>; }

function Booking() {
  const [form,setForm]=useState({name:'',phone:'',serviceId:SERVICES[0].id,date:'',time:'',hairColor:'1B',sameDay:false,notes:'',addons:[]});
  const selected = SERVICES.find(s=>s.id===form.serviceId);
  const estimate = useMemo(()=>calculateBookingEstimate(form, SERVICES, ADD_ONS),[form]);
  const sms = buildSmsBookingText(form, selected, estimate);
  const toggleAddon=(id)=>setForm(f=>({...f,addons:f.addons.includes(id)?f.addons.filter(x=>x!==id):[...f.addons,id]}));
  return <main className="section page booking-page"><p className="eyebrow">Booking</p><h1>Request an appointment</h1><p className="page-intro">This request creates a clean booking summary. Appointments are confirmed after approval and deposit instructions.</p><div className="booking-layout"><form className="booking-form">
    <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>
    <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Best contact number"/></label>
    <label>Service<select value={form.serviceId} onChange={e=>setForm({...form,serviceId:e.target.value})}>{SERVICES.map(s=><option key={s.id} value={s.id}>{s.name} - ${s.basePrice}+</option>)}</select></label>
    <div className="two"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Time<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>
    {selected?.hairIncluded && <label>Hair color<select value={form.hairColor} onChange={e=>setForm({...form,hairColor:e.target.value})}><option>1</option><option>1B</option><option>2</option><option>4</option><option>Other - client must confirm</option></select><small>Hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.</small></label>}
    <fieldset><legend>Add-ons</legend>{ADD_ONS.map(a=><label className="check" key={a.id}><input type="checkbox" checked={form.addons.includes(a.id)} onChange={()=>toggleAddon(a.id)}/>{a.name} <span>+${a.price}</span></label>)}</fieldset>
    <label className="check"><input type="checkbox" checked={form.sameDay} onChange={e=>setForm({...form,sameDay:e.target.checked})}/>Same-day request</label>
    <label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Style length, size, inspiration notes, or questions"/></label>
  </form><aside className="summary"><h3>Booking estimate</h3><p className="big-price">${estimate.total}+</p><p>Base service: ${estimate.base}</p><p>Add-ons: ${estimate.addons}</p><p>Deposit due: ${estimate.deposit}</p><p className={estimate.flags.length?'notice':'quiet'}>{estimate.flags.join(' ') || 'No special flags selected.'}</p><a className="primary full" href={`sms:?&body=${encodeURIComponent(sms)}`}>Send Booking Text <MessageCircle size={18}/></a></aside></div></main>;
}

function ReviewCard({r}) {return <article className="review-card"><div className="stars">{Array.from({length:5}).map((_,i)=><Star key={i} size={16} fill="currentColor"/>)}</div><p>“{r.text}”</p><strong>{r.name}</strong></article>}
function Reviews() {return <main className="section page"><p className="eyebrow">Reviews</p><h1>Approved client reviews</h1><p className="page-intro">Public reviews should stay curated and admin-approved before appearing on the site.</p><div className="cards">{APPROVED_REVIEWS.map((r,i)=><ReviewCard r={r} key={i}/>)}</div></main>}
function Contact() {const [q,setQ]=useState({name:'',question:''}); const body=buildSmsQuestionText(q); return <main className="section page contact-page"><p className="eyebrow">Contact</p><h1>Ask a question</h1><p className="page-intro">Send a quick question before booking. The button opens your messages app with everything filled in.</p><div className="contact-card"><label>Name<input value={q.name} onChange={e=>setQ({...q,name:e.target.value})} placeholder="Your name"/></label><label>Question<textarea value={q.question} onChange={e=>setQ({...q,question:e.target.value})} placeholder="What would you like to ask?"/></label><a className="primary full" href={`sms:?&body=${encodeURIComponent(body)}`}>Open Message App</a></div></main>}
function Policies(){return <main className="section page"><p className="eyebrow">Policies</p><h1>Appointment policies</h1><div className="policy-grid">{['A $25 deposit is required to secure your appointment.','Appointments are available Tuesday through Saturday from 8:30 AM to 6:00 PM by appointment.','Ravishing Beauté is closed Sunday and Monday.','Same-day bookings are only accepted if approved.','Please come detangled to stay on schedule.','Late arrivals may affect service timing and appointment approval.'].map(x=><article className="policy" key={x}><CheckCircle2/><p>{x}</p></article>)}</div></main>}

function App(){const [page,setPage]=useState('Home'); const map={Home:<Home setPage={setPage}/>,Gallery:<Gallery/>,Services:<Services setPage={setPage}/>,About:<About/>,Booking:<Booking/>,Reviews:<Reviews/>,Contact:<Contact/>,Policies:<Policies/>}; return <><Header page={page} setPage={setPage}/>{map[page]}<Footer setPage={setPage}/></>}

createRoot(document.getElementById('root')).render(<App/>);
