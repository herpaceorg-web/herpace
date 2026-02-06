import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with header and navigation
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-normal text-primary font-[family-name:'Petrona'] leading-none">HerPace</h1>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === '/dashboard'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                Training Hub
              </Link>
              <Link
                to="/calendar"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === '/calendar'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                Calendar
              </Link>
{/* History link commented out for hackathon MVP
              <Link
                to="/history"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname.startsWith('/history')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                History
              </Link>
              */}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8 px-24">
        {children}
      </main>
    </div>
  )
}
