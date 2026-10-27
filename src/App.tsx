import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Layers3,
  Menu,
  Palette,
  Send,
  Sparkles,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react';
import { FORMSPREE_FORM_ID } from './config';

const OrbitalScene = lazy(() => import('./components/OrbitalScene'));

const services = [
  {
    number: '01',
    icon: Code2,
    title: 'Web & software',
    description: 'Fast, responsive digital experiences that make your business easier to discover, trust and choose.',
    tags: ['Websites', 'Web apps', 'UI / UX'],
  },
  {
    number: '02',
    icon: Workflow,
    title: 'AI & automation',
    description: 'Practical workflows that reduce repetitive work, connect your tools and help your team move faster.',
    tags: ['Workflow design', 'AI integrations', 'Systems'],
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Digital growth',
    description: 'Clear content, strong foundations and measurable campaigns built around your business goals.',
    tags: ['SEO foundations', 'Social media', 'Campaigns'],
  },
  {
    number: '04',
    icon: Palette,
    title: 'Creative studio',
    description: 'A consistent visual identity and thoughtful creative that gives your brand a recognisable point of view.',
    tags: ['Brand identity', 'Creative assets', 'Content'],
  },
];

const projects = [
  {
    index: '01',
    name: 'KINFORM',
    kind: 'WEBSITE CONCEPT',
    title: 'A clearer digital home for a fitness brand.',
    description: 'A concept for a fitness business focused on clearer class discovery and enquiries.',
    approach: 'Prioritise class discovery, coaching details and a concise enquiry path.',
    style: 'fitness',
    label: 'WEB DESIGN / DEVELOPMENT',
  },
  {
    index: '02',
    name: 'FLOWSTATE',
    kind: 'AUTOMATION CONCEPT',
    title: 'Less admin. A more useful workflow.',
    description: 'A demonstration concept for capturing, organising and routing incoming enquiries.',
    approach: 'Map a lightweight lead flow from capture through sorting to human follow-up.',
    style: 'workflow',
    label: 'AI / WORKFLOW DESIGN',
  },
  {
    index: '03',
    name: 'FORME',
    kind: 'BRAND CONCEPT',
    title: 'One visual language, across every touchpoint.',
    description: 'A sample identity concept for a distinctive, consistent digital presence.',
    approach: 'Carry a flexible typographic and colour system across web and social touchpoints.',
    style: 'creative',
    label: 'BRANDING / CREATIVE',
  },
];

const steps = [
  { no: '01', title: 'Discover', text: 'We learn about the business, the audience and the problem that actually needs solving.' },
  { no: '02', title: 'Define', text: 'We agree on scope, deliverables, milestones and what a successful outcome looks like.' },
  { no: '03', title: 'Design', text: 'We shape the visual direction and user experience around your audience and goals.' },
  { no: '04', title: 'Build', text: 'We implement, integrate and test the solution across the devices people use.' },
  { no: '05', title: 'Deliver', text: 'We launch, hand over clearly and provide the support agreed for the project.' },
];

function BrandMark({ small = false }: { small?: boolean }) {
  return <img className={`brand-mark${small ? ' brand-mark--small' : ''}`} src="/assets/cultstudio-logo-64.webp" srcSet="/assets/cultstudio-logo-64.webp 64w, /assets/cultstudio-logo-128.webp 128w" sizes={small ? '40px' : '58px'} width={small ? 40 : 58} height={small ? 40 : 58} alt="" aria-hidden="true" />;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="section-label"><span className="section-label__dot" />{children}</div>;
}

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sceneEnabled, setSceneEnabled] = useState(false);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(() => setSceneEnabled(true), { timeout: 1000 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(() => setSceneEnabled(true), 500);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.section-block, .intro-strip, .why-section, .faq-section, .contact-layout, .project-card, .service-card, .process-step');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    items.forEach((item) => item.classList.add('motion-ready'));
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    items.forEach((item) => reveal.observe(item));
    return () => reveal.disconnect();
  }, []);

  const closeMenu = () => setMobileOpen(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSent(false);

    if (!FORMSPREE_FORM_ID) {
      setError('The enquiry form is not connected yet. Add your Formspree form ID to VITE_FORMSPREE_FORM_ID.');
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = String(formData.get('name') ?? '').trim();
    formData.set('_subject', name ? 'CultStudio project enquiry — ' + name : 'CultStudio project enquiry');

    setIsSubmitting(true);
    try {
      const response = await fetch('https://formspree.io/f/' + encodeURIComponent(FORMSPREE_FORM_ID), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (!response.ok) {
        setError('Formspree could not accept this enquiry. Please check your form setup or try again shortly.');
        return;
      }

      formElement.reset();
      setSent(true);
    } catch {
      setError('We could not reach Formspree. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="site-shell">
      <div className="topline"><span>DESIGN · ENGINEERING · AUTOMATION</span><span>INDEPENDENT CREATIVE TECHNOLOGY STUDIO</span></div>
      <header className="site-header">
        <a href="#home" className="brand-lockup" onClick={closeMenu}>
          <BrandMark />
          <span className="brand-wordmark">CULT<span>STUDIO</span><small>DIGITAL · TECH · CREATIVE</small></span>
        </a>
        <button className="mobile-menu-button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="primary-navigation">
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav id="primary-navigation" className={`main-nav${mobileOpen ? ' main-nav--open' : ''}`} aria-label="Main navigation">
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#studio" onClick={closeMenu}>Studio</a>
          <a href="#process" onClick={closeMenu}>Process</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a className="nav-cta" href="#contact" onClick={closeMenu}>Start a project <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero section-wrap" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-pulse" />INDEPENDENT DIGITAL STUDIO</div>
            <h1 className="hero-brand-title"><span className="hero-brand-title__cult">Cult</span><span className="hero-brand-title__studios">Studio</span></h1>
            <p className="hero-manifesto">Make your next <em>big idea real.</em></p>
            <p className="hero-description">We shape clear, useful digital experiences across web, AI and creative — from first thought to final detail.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#contact">Start a project <ArrowUpRight size={17} /></a>
              <a className="text-link" href="#work">Explore our work <ArrowDownRight size={16} /></a>
            </div>
            <div className="hero-footnote"><span className="tiny-star">✳</span> THOUGHTFUL BY DESIGN. BUILT TO WORK.</div>
          </div>

          <div className="hero-art" aria-hidden="true"><div className="hero-art__glow"/>{sceneEnabled ? <Suspense fallback={<div className="hero-scene hero-scene--fallback"/>}><OrbitalScene /></Suspense> : <div className="hero-scene hero-scene--fallback"/>}<span className="scene-caption"><span/> FORM, IN MOTION</span></div>
          <div className="hero-bottomline"><span>WEB & SOFTWARE</span><span>AI & AUTOMATION</span><span>DESIGN & GROWTH</span></div>
        </section>

        <section className="intro-strip section-wrap">
          <div className="intro-strip__mark"><Sparkles size={19}/></div>
          <p>Not just a pretty interface. <strong>A useful solution, built around your business.</strong></p>
          <a href="#services" aria-label="Explore services"><ArrowRight size={20}/></a>
        </section>

        <section className="section-wrap section-block" id="services">
          <div className="section-heading">
            <div><SectionLabel>WHAT WE DO</SectionLabel><h2>Different disciplines.<br/><em>One clear direction.</em></h2></div>
            <p>Bring us a business problem, a half-formed idea or a growth goal. We’ll help you find the right combination of design and technology.</p>
          </div>
          <div className="services-grid">
            {services.map(({ number, icon: Icon, title, description, tags }) => (
              <article className="service-card" key={number}>
                <div className="service-card__top"><span className="card-number">{number}</span><span className="service-icon"><Icon size={20} strokeWidth={1.6}/></span></div>
                <h3>{title}</h3><p>{description}</p>
                <div className="tag-list">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <a className="card-arrow" href="#contact" aria-label={`Discuss ${title}`}><ArrowUpRight size={18}/></a>
              </article>
            ))}
          </div>
        </section>

        <section className="work-section" id="work">
          <div className="section-wrap section-block">
            <div className="section-heading section-heading--work">
              <div><SectionLabel>THE KIND OF WORK WE DO</SectionLabel><h2>Small concepts.<br/><em>Real-world thinking.</em></h2></div>
              <div className="work-disclaimer"><span className="disclaimer-dot"/> CONCEPT EXPLORATIONS<br/><small>These are illustrative concepts, not client claims.</small></div>
            </div>
            <div className="projects-grid">
              {projects.map(project => (
                <article className="project-card" key={project.index}>
                  <div className={`project-visual project-visual--${project.style}`}>
                    <div className="project-visual__noise" />
                    <div className="project-visual__top"><span>{project.name}</span><span>{project.index} / 03</span></div>
                    {project.style === 'fitness' && <div className="fitness-composition"><span className="fitness-kicker">MOVE WITH PURPOSE</span><span className="fitness-title">TRAIN<br/><i>YOUR WAY.</i></span><div className="fitness-lines"/><span className="visual-pill">MEMBERSHIPS · CLASSES · COACHING</span></div>}
                    {project.style === 'workflow' && <div className="workflow-composition"><div className="flow-node flow-node--a"><span className="flow-node__icon"><Layers3 size={16}/></span><b>New enquiry</b><small>Form received</small></div><div className="flow-connector"/><div className="flow-node flow-node--b"><span className="flow-node__icon"><Workflow size={16}/></span><b>Organise</b><small>Route to the right place</small></div><div className="flow-connector"/><div className="flow-node flow-node--c"><span className="flow-node__icon"><Check size={16}/></span><b>Follow up</b><small>Team notified</small></div></div>}
                    {project.style === 'creative' && <div className="creative-composition"><span className="creative-kicker">FORME / IDENTITY STUDY</span><span className="creative-serif">Form<br/><i>follows</i><br/>feeling.</span><div className="creative-swatches"><i/><i/><i/><i/></div><span className="creative-caption">A SYSTEM FOR A DISTINCT POINT OF VIEW.</span></div>}
                  </div>
                  <div className="project-meta"><span>{project.kind}</span><span>{project.label}</span></div>
                  <h3>{project.title}</h3><p>{project.description}</p><details className="project-details"><summary>Explore concept details <ArrowUpRight size={14}/></summary><div><p><b>Objective</b>{project.description}</p><p><b>Approach</b>{project.approach}</p><p><b>Services</b>{project.label}</p></div></details>
                </article>
              ))}
            </div>
          </div>
        </section>


        <section className="why-section section-wrap" aria-labelledby="why-heading"><div><SectionLabel>WHY CULTSTUDIO</SectionLabel><h2 id="why-heading">Good thinking.<br/><em>Careful execution.</em></h2></div><div className="why-list"><p><span>01</span><b>Creative and technical thinking, together.</b><small>Design and engineering decisions stay connected from the first conversation.</small></p><p><span>02</span><b>Clear scope and communication.</b><small>Know what we are building, what it includes and what happens next.</small></p><p><span>03</span><b>Built for real use.</b><small>Responsive, considered experiences shaped around your goals and constraints.</small></p></div></section>
        <section className="section-wrap section-block process-section" id="studio">
          <div className="section-heading">
            <div><SectionLabel>HOW WE WORK</SectionLabel><h2>Clear process.<br/><em>Better collaboration.</em></h2></div>
            <p>Good work comes from clear expectations, steady communication and care at every stage — not surprises at the end.</p>
          </div>
          <div className="process-grid" id="process">
            {steps.map(step => <article className="process-step" key={step.no}><span className="process-number">{step.no}</span><h3>{step.title}</h3><p>{step.text}</p><span className="process-line" /></article>)}
          </div>
          <div className="studio-note"><div className="studio-note__mark"><BrandMark small/></div><div><span className="studio-note__label">A LITTLE ABOUT THE STUDIO</span><h3>A small team.<br/><em>One clear direction.</em></h3><p>CultStudio brings design, engineering, automation and growth into one collaborative studio. We keep the process direct, the decisions thoughtful and the details considered.</p></div><div className="studio-note__side">IDEAS, MADE<br/>USEFUL.</div></div>
        </section>

        <section className="faq-section section-wrap" id="faq" aria-labelledby="faq-heading"><div className="faq-intro"><SectionLabel>GOOD TO KNOW</SectionLabel><h2 id="faq-heading">A few clear<br/><em>answers.</em></h2><p>Still have a question? Tell us what you’re thinking.</p><a className="text-link" href="#contact">Talk to the studio <ArrowRight size={16}/></a></div><div className="faq-list"><details><summary>What can CultStudio help with?<span>+</span></summary><p>Websites and software, practical AI automation, digital marketing foundations, brand identity and creative assets.</p></details><details><summary>How does a project get started?<span>+</span></summary><p>Share a little about the idea through the enquiry form. We’ll use that context to start a conversation about the goal, scope and next steps.</p></details><details><summary>Do I need a finished brief?<span>+</span></summary><p>No. A rough idea, a business challenge or a list of things that should work better is enough to begin.</p></details><details><summary>Are the projects shown client work?<span>+</span></summary><p>The examples on this site are concept explorations created to show the kinds of problems and visual directions we work with.</p></details></div></section>

        <section className="contact-section" id="contact">
          <div className="section-wrap contact-layout">
            <div className="contact-copy"><SectionLabel>HAVE SOMETHING IN MIND?</SectionLabel><h2>Let’s make<br/><em>it useful.</em></h2><p>Tell us a little about what you’re building, what’s getting in the way or what you want to improve. We’ll take it from there.</p><div className="contact-aside"><span className="contact-aside__icon"><Send size={17}/></span><span><b>Every good project starts with a conversation.</b><small>No pressure. Just a clear first step.</small></span></div></div>
            <form className="contact-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <div className="form-heading"><span>PROJECT ENQUIRY</span><span>SECURE FORM</span></div>
              <label className="form-honeypot" aria-hidden="true">Leave this field empty<input name="_gotcha" type="text" tabIndex={-1} autoComplete="off" /></label>
              <div className="form-row"><label>Your name<input required name="name" autoComplete="name" placeholder="Name" /></label><label>Your email<input required name="email" type="email" autoComplete="email" placeholder="you@company.com" /></label></div>
              <label>Business name <span className="optional-label">OPTIONAL</span><input name="company" autoComplete="organization" placeholder="Your business" /></label>
              <label>What do you need help with?<select name="service" defaultValue=""><option value="" disabled>Choose a service</option><option>Website or software</option><option>AI or automation</option><option>Digital marketing</option><option>Branding or creative</option><option>Not sure yet</option></select></label>
              <label>Estimated budget<select name="budget" defaultValue=""><option value="" disabled>Select a range (optional)</option><option>Under ₹10,000</option><option>₹10,000–₹25,000</option><option>₹25,000–₹50,000</option><option>₹50,000+</option><option>Need guidance</option></select></label>
              <label>Tell us about the project<textarea required name="details" rows={4} placeholder="A little context, your goals and what success looks like…"/></label>
              <label className="consent-label"><input required type="checkbox" name="consent" /> I agree that CultStudio may use these details to respond, with Formspree processing this submission. <a href="/privacy.html">Privacy notice</a>.</label>
              <button className="button button-primary form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : sent ? 'Send another enquiry' : 'Send project brief'} <ArrowUpRight size={17}/></button>
              {error && <p className="form-message form-message--error" role="alert">{error}</p>}
              {sent && <p className="form-message" role="status" aria-live="polite">Your enquiry was submitted successfully. We’ll be in touch.</p>}
              <p className="form-privacy">Your submission is securely sent to Formspree and may be stored in its dashboard. See our <a href="/privacy.html">privacy notice</a>.</p>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer section-wrap">
        <a href="#home" className="brand-lockup brand-lockup--footer"><BrandMark small/><span className="brand-wordmark">CULT<span>STUDIO</span><small>DIGITAL · TECH · CREATIVE</small></span></a>
        <span className="footer-note">Ideas into digital experiences.</span>
        <div className="footer-links"><a href="#work">Work</a><a href="#services">Services</a><a href="#studio">Studio</a><a href="#faq">FAQ</a><a href="#contact">Contact</a><a href="/privacy.html">Privacy</a></div>
        <span className="copyright">© {new Date().getFullYear()} CultStudio</span>
      </footer>
    </div>
    </>
  );
}

export default App;
