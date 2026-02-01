import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl text-foreground mb-8">Page not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
