import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">HerPace</h1>

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
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
