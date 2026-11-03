import { useState } from 'react'
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react'

const mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-80%2C180%2C80&layer=mapnik'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function updateField(event) {
    setSubmitted(false)
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submitForm(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <section className="public-page-hero contact-page-hero">
        <div className="public-container">
          <span className="public-eyebrow">WE’RE HERE TO HELP</span>
          <h1>Let’s start a conversation.</h1>
          <p>Questions, ideas, or just want to say hello? We’d love to hear from you.</p>
        </div>
      </section>

      <section className="public-container contact-content">
        <div className="contact-map-card">
          <iframe
            title="Generic world map preview"
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="contact-map-caption"><MapPin size={16} /><span><strong>EstateFlow, wherever you work</strong><small>Generic world map preview — no office location is configured.</small></span></div>
          <span className="contact-map-attribution">© OpenStreetMap contributors</span>
        </div>

        <div className="contact-grid">
          <aside className="contact-details">
            <span className="public-eyebrow">CONTACT DETAILS</span>
            <b><h2>We’re just a message away.</h2></b>
            <p>Reach out directly or leave a note and we’ll be glad to connect.</p>

            <a className="contact-detail-card" href="mailto:estateflow@gmail.com">
              <span><Mail size={18} /></span>
              <span><small>Email us</small><strong>estateflow@gmail.com</strong></span>
            </a>
            <a className="contact-detail-card" href="tel:+923366641190">
              <span><Phone size={18} /></span>
              <span><small>Call us</small><strong>+92-336-6641190</strong></span>
            </a>

            <div className="contact-developer">
              <img className="contact-developer-avatar" src="/images/developer-profile.png" alt="Muhammad Arham" />
              <span><small>Developer</small><strong>Muhammad Arham</strong><em>Front-End Developer</em></span>
            </div>
            <p className="contact-developer-copy"><em>Building thoughtful, responsive digital experiences that make everyday work feel simpler and more connected.</em></p>
          </aside>

          <section className="contact-form-card">
            <span className="public-eyebrow">SEND A MESSAGE</span>
            <b><h2>How can we help?</h2></b>
            <p>Fill in the form and we’ll be in touch.</p>
            <form onSubmit={submitForm}>
              <label>
                Full name
                <input name="name" value={form.name} onChange={updateField} autoComplete="name" placeholder="Your name" required />
              </label>
              <label>
                Email address
                <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" required />
              </label>
              <label>
                Message
                <textarea name="message" value={form.message} onChange={updateField} rows="5" placeholder="Tell us what’s on your mind..." required />
              </label>
              <button className="public-button public-button-primary" type="submit">Submit message <Send size={16} /></button>
              {submitted && (
                <p className="contact-form-notice" role="status">
                  <CheckCircle2 size={17} />
                  Thanks, {form.name.trim()}. This front-end demo does not send or store messages.
                </p>
              )}
              <small className="contact-form-disclaimer">Demo form only — messages are not sent or stored.</small>
            </form>
          </section>
        </div>
      </section>
    </>
  )
}
