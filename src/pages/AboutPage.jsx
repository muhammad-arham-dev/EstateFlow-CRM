import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const principles = [
  {
    number: '01',
    title: 'Relationships come first',
    text: 'Real estate is built on trust. Keep the people and the context behind every opportunity at the center of your work.',
  },
  {
    number: '02',
    title: 'The whole picture, together',
    text: 'Bring leads, clients, properties, conversations, and follow-ups into one connected flow.',
  },
  {
    number: '03',
    title: 'Make the next step clear',
    text: 'A thoughtful overview helps teams focus on what needs attention and where an opportunity can go next.',
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="public-page-hero about-page-hero">
        <div className="public-container about-hero-grid">
          <div>
            <span className="public-eyebrow"><Sparkles size={14} /> ABOUT ESTATEFLOW</span>
            <h1>Real estate is about people. Your workspace should be, too.</h1>
            <p>EstateFlow is designed to make the busy work feel more connected—so real-estate teams can give more attention to the relationships that matter.</p>
            <Link className="public-button public-button-primary" to="/contact">Talk with us <ArrowRight size={17} /></Link>
          </div>
          <div className="about-hero-art">
            <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85" alt="Comfortable modern living space with natural light" />
            <span className="about-art-note"><strong>Every detail,</strong><br />in its right place.</span>
            <span className="about-art-ring" />
          </div>
        </div>
      </section>

      <section className="about-story public-container">
        <div className="about-story-label"><span className="public-eyebrow">OUR POINT OF VIEW</span><span className="about-story-line" /></div>
        <div className="about-story-copy">
          <h2>A little more clarity changes the way a team moves.</h2>
          <p>When information lives in different places, it is easy for follow-ups and important context to get lost. EstateFlow brings the everyday pieces of real-estate work into a clearer flow—from first inquiry through ongoing client relationships and completed deals.</p>
          <p>Our goal is simple: make a helpful, approachable workspace that gives teams a better view of their work without losing sight of the people behind it.</p>
        </div>
      </section>

      <section className="about-principles">
        <div className="public-container">
          <div className="home-section-heading">
            <div><span className="public-eyebrow">WHAT GUIDES US</span><h2>Purposeful by design.</h2></div>
            <p>Simple ideas that shape a more connected real-estate experience.</p>
          </div>
          <div className="home-feature-grid">
            {principles.map(({ number, title, text }) => (
              <article className="home-feature-card" key={number}>
                <span className="home-feature-number">{number}</span>
                <span className="home-feature-index">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="home-feature-arrow"><ArrowUpRight size={17} /></span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta public-container">
        <div><span className="public-eyebrow">LET’S MOVE FORWARD</span><h2>See how EstateFlow can fit your day.</h2></div>
        <Link className="public-button public-button-primary" to="/contact">Get in touch <ArrowRight size={17} /></Link>
      </section>
    </>
  )
}
