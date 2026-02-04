import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VoiceSessionState } from '@/types/voice'

interface VoiceButtonProps {
  state: VoiceSessionState
  onClick: () => void
  disabled?: boolean
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function VoiceButton({
  state,
  onClick,
  disabled = false,
  className,
  size = 'default'
}: VoiceButtonProps) {
  const isActive = state !== 'idle' && state !== 'error'

  const getIcon = () => {
    switch (state) {
      case 'connecting':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'listening':
        return <Mic className="h-4 w-4" />
      case 'responding':
        return <Volume2 className="h-4 w-4 animate-pulse" />
      case 'error':
        return <MicOff className="h-4 w-4" />
      default:
        return <Mic className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting...'
      case 'listening':
        return 'Listening...'
      case 'processing':
        return 'Processing...'
      case 'responding':
        return 'Speaking...'
      case 'error':
        return 'Error'
      default:
        return 'Voice'
    }
  }

  const getAriaLabel = () => {
    switch (state) {
      case 'idle':
        return 'Start voice assistant'
      case 'connecting':
        return 'Connecting to voice assistant'
      case 'listening':
        return 'Voice assistant is listening. Click to stop.'
      case 'processing':
        return 'Processing your speech'
      case 'responding':
        return 'Voice assistant is speaking'
      case 'error':
        return 'Voice assistant error. Click to retry.'
      default:
        return 'Voice assistant'
    }
  }

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size={size}
      onClick={onClick}
      disabled={disabled || state === 'connecting' || state === 'processing'}
      className={cn(
        'relative',
        isActive && 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500',
        state === 'listening' && 'animate-pulse',
        className
      )}
      aria-label={getAriaLabel()}
      aria-busy={state === 'connecting' || state === 'processing'}
    >
      {getIcon()}
      {size !== 'icon' && <span className="ml-2">{getLabel()}</span>}

      {/* Pulsing ring effect when listening */}
      {state === 'listening' && (
        <span className="absolute inset-0 rounded-md animate-ping bg-rose-400 opacity-25" />
      )}
    </Button>
  )
}

/**
 * Floating voice button variant for mobile/overlay use
 */
export function FloatingVoiceButton({
  state,
  onClick,
  disabled = false,
  className
}: Omit<VoiceButtonProps, 'size'>) {
  const isActive = state !== 'idle' && state !== 'error'

  const getIcon = () => {
    switch (state) {
      case 'connecting':
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin" />
      case 'listening':
        return <Mic className="h-6 w-6" />
      case 'responding':
        return <Volume2 className="h-6 w-6 animate-pulse" />
      case 'error':
        return <MicOff className="h-6 w-6" />
      default:
        return <Mic className="h-6 w-6" />
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || state === 'connecting' || state === 'processing'}
      className={cn(
        'relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'bg-rose-500 hover:bg-rose-600 text-white'
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
        state === 'listening' && 'animate-pulse',
        className
      )}
      aria-label={state === 'idle' ? 'Start voice assistant' : 'Stop voice assistant'}
    >
      {getIcon()}

      {/* Pulsing ring effect when listening */}
      {state === 'listening' && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-25" />
          <span className="absolute -inset-1 rounded-full animate-pulse bg-rose-300 opacity-20" />
        </>
      )}
    </button>
  )
}
