import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { Building2 } from 'lucide-react'
import '../styles/auth.css'

const roleOptions = ['Agency Admin', 'Manager/Broker', 'Agent']

const screenContent = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to continue to your real estate workspace.",
  },
  register: {
    title: "Create your account",
    subtitle: "Set up your workspace to get started.",
  },
  "forgot-password": {
    title: "Reset your password",
    subtitle: "Enter your email to request a password reset.",
  },
  "reset-password": {
    title: "Choose a new password",
    subtitle: "This is a local demo of the password reset flow.",
  },

  "verify-email": {
    title: "Verify your email",
    subtitle: "Use this demo screen to preview the email verification flow.",
  },
};

export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('Agent')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const content = screenContent[mode] || screenContent.login

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === "login") {
        await login({ email, password, role });
        const destination = location.state?.from?.pathname || "/dashboard";
        navigate(destination, { replace: true });
      } else if (mode === "register") {
        await register({ name, email, password, role });
        navigate("/dashboard", { replace: true });
      } else if (mode === "forgot-password") {
        // No email is sent in this mock flow.
        setMessage(
          "If an account exists for this email, password reset instructions would be sent.",
        );
      } else if (mode === "verify-email") {
        setMessage(
          "Demo only: the backend must send a verification email and validate its token.",
        );
      } else if (mode === "reset-password") {
        if (password.length < 8) {
          throw new Error("Use a password with at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("The passwords do not match.");
        }
        setMessage(
          "Demo only: connect this form to your backend password-reset endpoint.",
        );
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Building2 size={22} strokeWidth={2.4} />
          </span>

          <div className="auth-brand-text">
            <span className="auth-brand-subtitle">EstateFlow</span>
          </div>
        </div>

        <div className="auth-brand-copy">
          <span className="auth-eyebrow">REAL ESTATE WORKSPACE</span>
          <h1>Every relationship starts with a better experience.</h1>
          <p>
            Keep your leads, clients, properties, and deals moving forward in
            one organized workspace.
          </p>
        </div>

        <div className="auth-brand-footer">Built for real estate teams</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <span className="auth-brand-mark">
            <Building2 size={22} strokeWidth={2.4} />
          </span>

          <span className="auth-brand-name">EstateFlow</span>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-heading">
            <h2>{content.title}</h2>
            <p>{content.subtitle}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            {mode !== "reset-password" && (
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </label>
            )}

            {(mode === "login" ||
              mode === "register" ||
              mode === "reset-password") && (
              <label>
                {mode === "reset-password" ? "New password" : "Password"}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    mode === "login"
                      ? "Enter your password"
                      : "At least 8 characters"
                  }
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? undefined : 8}
                  required
                />
              </label>
            )}

            {mode === "reset-password" && (
              <label>
                Confirm new password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}

            {mode === "verify-email" && (
              <p>
                Return to <Link to="/login">sign in</Link>
              </p>
            )}

            {import.meta.env.DEV &&
              (mode === "login" || mode === "register") && (
                <label>
                  Development role
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="auth-help">
                    Test the interface as different user roles.
                  </span>
                </label>
              )}

            {error && (
              <p className="auth-message auth-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="auth-message auth-success" role="status">
                {message}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : mode === "forgot-password"
                      ? "Request reset"
                      : "Reset password"}
            </button>
          </form>

          <div className="auth-links">
            {mode === "login" && (
              <>
                <Link to="/forgot-password">Forgot password?</Link>
                <p>
                  Don't have an account? <Link to="/register">Create one</Link>
                </p>
              </>
            )}

            {mode === "register" && (
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            )}

            {mode === "forgot-password" && (
              <p>
                <Link to="/login">Back to sign in</Link>
              </p>
            )}

            {mode === "reset-password" && (
              <p>
                <Link to="/login">Return to sign in</Link>
              </p>
            )}
          </div>

          <p className="auth-legal">
            Secure access for your real estate workspace
          </p>
        </div>
      </section>
    </main>
  );
}
