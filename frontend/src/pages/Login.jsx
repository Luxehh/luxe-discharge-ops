import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'
import PasswordInput from '../components/PasswordInput'
import { homePathForUser } from '../utils/roles'

const fieldClass =
  'w-full rounded-md border border-[#d0d0d0] px-3.5 py-2.5 text-[14px] text-luxe-text outline-none placeholder:text-[#999] focus:border-luxe-btn focus:ring-1 focus:ring-luxe-btn'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const loggedInUser = await login(email, password)
      navigate(homePathForUser(loggedInUser), { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-luxe-gray px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[440px] overflow-hidden rounded-lg bg-white shadow-luxe-card"
      >
        <div className="px-5 pt-7 pb-6 sm:px-8 sm:pt-8">
          <div className="mb-5 flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <h1 className="text-[20px] font-bold tracking-tight text-luxe-text sm:text-[22px]">
            Login
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-luxe-muted">
            Multi-location discharge tracking
          </p>

          <div className="mt-7">
            <label
              htmlFor="email"
              className="mb-2 block text-[13px] font-semibold text-luxe-text"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. illinois@luxehh.com"
              required
              autoComplete="username"
              className={fieldClass}
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="password"
              className="mb-2 block text-[13px] font-semibold text-luxe-text"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Password"
              className={fieldClass}
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-[#eee] bg-luxe-footer px-5 py-4 sm:px-8">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-luxe-btn px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-luxe-olive-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:py-2"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  )
}
