import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const propertyImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
]

const momentumImages = [
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
]

const features = [
  {
    number: '01',
    title: 'Know every relationship',
    text: 'Keep lead and client details together, with the context your next conversation needs.',
    icon: '01',
  },
  {
    number: '02',
    title: 'Keep the next step clear',
    text: 'Organize follow-ups, tasks, appointments, and notes in one connected workspace.',
    icon: '02',
  },
  {
    number: '03',
    title: 'Move deals forward',
    text: 'See your pipeline at a glance and keep opportunities moving from first contact to close.',
    icon: '03',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="public-container home-hero-grid">
          <div className="home-hero-copy">
            <span className="public-eyebrow"><Sparkles size={14} /> REAL ESTATE, IN FLOW</span>
            <h1>Make room for <em>better</em> real-estate relationships.</h1>
            <p>One thoughtful workspace for your leads, clients, properties, and every next step in between.</p>
            <div className="home-hero-actions">
              <Link className="public-button public-button-primary" to="/register">Get started <ArrowRight size={17} /></Link>
              <Link className="public-button public-button-quiet" to="/about">Discover EstateFlow <ChevronRight size={16} /></Link>
            </div>
            <div className="home-hero-note"><span className="home-note-dot" /> A calmer way to manage your day</div>
          </div>

          <div className="home-hero-visual" aria-label="A modern home and an example CRM overview">
            <div className="home-hero-image home-hero-image-main">
              <img src={propertyImages[0]} alt="Modern home surrounded by greenery" fetchPriority="high" />
            </div>
            <div className="home-hero-image home-hero-image-small">
              <img src={propertyImages[1]} alt="Light-filled contemporary home interior" />
            </div>
            <div className="home-float-card home-float-card-bottom">
              <span className="home-float-label">YOUR PIPELINE</span>
              <div className="home-pipeline-summary"><strong>12 active deals</strong><span>+18% this month</span></div>
              <div className="home-pipeline-bars"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="home-pipeline-labels"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span></div>
            </div>
            <span className="home-hero-orbit home-hero-orbit-one" />
            <span className="home-hero-orbit home-hero-orbit-two" />
          </div>
        </div>
        <a className="home-scroll-cue" href="#how-it-works"><ArrowDown size={15} /> Scroll to explore</a>
      </section>

      <section className="home-intro public-container" id="how-it-works">
        <div>
          <span className="public-eyebrow">YOUR BUSINESS, CONNECTED</span>
          <h2>Less switching.<br /><em>More meaningful</em> progress.</h2>
        </div>
        <p>Real estate is personal. EstateFlow brings your relationships and day-to-day work into one clear view, so you can spend less time searching and more time moving things forward.</p>
      </section>

      <section className="home-feature-section">
        <div className="public-container">
          <div className="home-section-heading">
            <div><span className="public-eyebrow">A BETTER WAY TO WORK</span><h2>Everything has its next step.</h2></div>
            <Link className="public-text-link" to="/about">Get to know us <ArrowUpRight size={16} /></Link>
          </div>
          <div className="home-feature-grid">
            {features.map((feature) => (
              <article className="home-feature-card" key={feature.number}>
                <span className="home-feature-number">{feature.icon}</span>
                <span className="home-feature-index">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className="home-feature-arrow"><ArrowUpRight size={17} /></span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-motion-section">
        <div className="public-container home-motion-grid">
          <div className="home-motion-copy">
            <span className="public-eyebrow">BUILT AROUND YOUR MOMENTUM</span>
            <h2>From the first hello to the final handshake.</h2>
            <p>Bring your conversations, schedule, and opportunities together. EstateFlow helps make the full journey easier to see and simpler to manage.</p>
            <ul>
              <li><Check size={16} /> A shared view of leads and clients</li>
              <li><Check size={16} /> Follow-ups that stay on your radar</li>
              <li><Check size={16} /> A pipeline that keeps its context</li>
            </ul>
            <Link className="public-text-link" to="/register">Explore your workspace <ArrowRight size={16} /></Link>
          </div>
          <div className="home-video-card">
            <div className="home-property-motion" role="img" aria-label="Animated montage of modern real-estate properties">
              {momentumImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={['Modern home exterior', 'Contemporary home interior', 'Bright residential living space'][index]}
                  className={`home-property-frame home-property-frame-${index + 1}`}
                  loading="lazy"
                />
              ))}
            </div>
            <div className="home-video-overlay">
              <span><small>REAL ESTATE, IN MOTION</small><strong>Keep your momentum.</strong></span>
            </div>
            <span className="home-video-caption">A little more clarity can move everything forward.</span>
          </div>
        </div>
      </section>

      <section className="home-gallery public-container">
        <div className="home-section-heading">
          <div><span className="public-eyebrow">SPACE FOR WHAT’S NEXT</span><h2>Every property starts a story.</h2></div>
          <p>Keep the details, people, and progress connected as each opportunity unfolds.</p>
        </div>
        <div className="home-gallery-grid">
          {propertyImages.map((image, index) => (
            <article className={`home-gallery-card home-gallery-card-${index + 1}`} key={image}>
              <img src={image} alt={['A welcoming modern property exterior', 'A warm, sunlit living space', 'A contemporary home framed by trees'][index]} loading="lazy" />
              <span>{['Find your next opportunity', 'Keep the details in reach', 'Make room to grow'][index]}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta-wrap">
        <div className="public-container">
          <div className="home-cta">
            <div className="home-cta-orb" />
            <span className="public-eyebrow">READY WHEN YOU ARE</span>
            <h2>Let’s make your next move a little clearer.</h2>
            <p>Bring your real-estate work into one welcoming workspace.</p>
            <Link className="public-button public-button-light" to="/register">Start exploring <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
