import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * Main application layout with header and navigation
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-normal text-primary font-[family-name:'Petrona'] leading-none">HerPace</h1>
          </Link>

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
