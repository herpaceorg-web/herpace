import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api-client'
import type { LoginRequest, AuthResponse } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HormoneWaveBackground } from '@/components/HormoneWaveBackground'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const request: LoginRequest = { email, password }
      const response = await api.post<LoginRequest, AuthResponse>('/api/auth/login', request)

      // Store token with expiration and update auth state
      login(response.token, response.expiresAt)

      // Navigate to root - RootRedirect will handle onboarding check
      navigate('/')

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Login failed. Please check your credentials.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white p-4">
      <HormoneWaveBackground opacity={0.3} />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="font-petrona text-[32px] font-normal text-primary">HerPace</CardTitle>
          <CardDescription className="text-sm font-normal text-[#696863]">Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent className="pb-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>

        <div className="relative flex items-center px-6 py-3">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-sm text-muted-foreground">or</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <CardFooter className="flex flex-col items-center pt-3">
          <Link to="/signup" className="w-full">
            <Button variant="outline" className="w-full">
              Create an Account
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
