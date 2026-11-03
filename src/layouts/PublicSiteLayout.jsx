import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Building2, Menu, UserRound, X } from 'lucide-react'
import '../styles/public-site.css'

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/', mark: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/', mark: 'instagram' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', mark: 'linkedin' },
  { label: 'TikTok', href: 'https://www.tiktok.com/', mark: 'tiktok' },
  { label: 'Twitter X', href: 'https://x.com/', mark: 'x' },
  { label: 'YouTube', href: 'https://www.youtube.com/', mark: 'youtube' },
]

function SocialMark({ mark }) {
  const paths = {
    facebook: <path d="M13.5 8H16V5h-2.5C10.7 5 9 6.7 9 9.5V12H6v3h3v7h3v-7h3l.5-3H12V9.5c0-1 .4-1.5 1.5-1.5z" fill="currentColor" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.8" r="1.2" fill="currentColor" /></>,
    linkedin: <><path d="M5 8.5v11M5 5.2v.1M9.5 19.5v-6.2a3.3 3.3 0 0 1 6.6 0v6.2M9.5 10v9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><circle cx="5" cy="5.2" r="1.3" fill="currentColor" /></>,
    tiktok: <path d="M19.6 8.3a7.4 7.4 0 0 1-4.4-1.5v8.1a6 6 0 1 1-5.2-5.9v3.2a2.8 2.8 0 1 0 2 2.7V2.8h3.2c.2 2 1.8 3.8 4.4 4.1z" fill="currentColor" />,
    x: <path d="M5 3h4.2l9.8 18h-4.2L5 3Zm-.5 18L10 13.8m4-3.6L19.5 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[mark]}
    </svg>
  )
}

const footerLinks = [
  [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
  ],
  [
    { label: 'Sign Up', to: '/register' },
    { label: 'Login', to: '/login' },
  ],
]

export default function PublicSiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function updateScrollState() {
      setIsScrolled(window.scrollY > 24)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="public-site">
      <header className={`public-header ${isScrolled ? 'public-header-scrolled' : ''}`}>
        <div className="public-header-inner">
          <Link className="public-brand" to="/" aria-label="EstateFlow home" onClick={closeMenu}>
            <span className="public-brand-mark"><Building2 size={22} strokeWidth={2.4} /></span>
            <span>Estate<span>Flow</span></span>
          </Link>

          <button
            className="public-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <nav className={`public-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
            <NavLink to="/about" onClick={closeMenu}>About Us</NavLink>
            <NavLink to="/contact" onClick={closeMenu}>Contact Us</NavLink>
          </nav>

          <details className="public-account">
            <summary aria-label="Open account menu" title="Account">
              <UserRound size={19} />
            </summary>
            <div className="public-account-menu">
              <span>Welcome to EstateFlow</span>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/register" onClick={closeMenu}>Sign Up</Link>
            </div>
          </details>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-main">
          <div className="public-footer-brand">
            <Link className="public-brand public-brand-light" to="/">
              <span className="public-brand-mark"><Building2 size={22} strokeWidth={2.4} /></span>
              <span>Estate<span>Flow</span></span>
            </Link>
            <p>A clearer way to build lasting real-estate relationships.</p>
          </div>

          <nav className="public-footer-links" aria-label="Footer navigation">
            <h2>Explore</h2>
            <div className="public-footer-link-columns">
              {footerLinks.map((column, index) => (
                <div className="public-footer-link-column" key={index}>
                  {column.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
                </div>
              ))}
            </div>
          </nav>

          <div className="public-social">
            <h2>Follow along</h2>
            <div>
              {socialLinks.map(({ label, href, mark }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                  <SocialMark mark={mark} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="public-footer-bottom">
          <span>© {new Date().getFullYear()} EstateFlow. All rights reserved.</span>
          <span>Made for better real-estate experiences.</span>
        </div>
      </footer>
    </div>
  )
}
