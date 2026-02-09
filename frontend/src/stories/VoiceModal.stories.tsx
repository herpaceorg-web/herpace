import type { Meta, StoryObj } from '@storybook/react-vite'
import { VoiceModal } from '@/components/voice/VoiceModal'
import { WorkoutType, IntensityLevel, CyclePhase } from '@/types/api'
import type { VoiceSessionContextDto } from '@/types/voice'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2, Volume2, X, AlertCircle, CheckCircle } from 'lucide-react'

const meta = {
  title: 'Components/Voice/VoiceModal',
  component: VoiceModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VoiceModal>

export default meta
type Story = StoryObj<typeof meta>

// Mock session context
const mockSessionContext: VoiceSessionContextDto = {
  sessionId: '1',
  sessionName: '30 Minute Easy Run',
  workoutType: WorkoutType.Easy,
  plannedDistance: 5,
  plannedDuration: 30,
  cyclePhase: CyclePhase.Follicular,
  phaseGuidance: 'Your energy levels are naturally rising - great time for a quality workout',
  workoutTips: [
    'Focus on maintaining an easy, conversational pace',
    'Keep your heart rate in Zone 2 for optimal aerobic development',
  ],
  intensityLevel: IntensityLevel.Low
}

// Wrapper component to handle dialog state
function VoiceModalWrapper({ sessionContext }: { sessionContext?: VoiceSessionContextDto }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Voice Modal</Button>
      <VoiceModal
        open={open}
        onOpenChange={setOpen}
        sessionId="1"
        sessionContext={sessionContext}
        onComplete={(response) => {
          console.log('Session completed:', response)
          alert('Session completed! Check console for details.')
        }}
      />
    </div>
  )
}

export const Default = {
  render: () => <VoiceModalWrapper sessionContext={mockSessionContext} />,
} as unknown as Story

export const WithoutContext = {
  render: () => <VoiceModalWrapper />,
} as unknown as Story

// Static mockup component for FloatingVoiceButton
function MockFloatingVoiceButton({
  state,
  showPulse = false
}: {
  state: 'idle' | 'connecting' | 'listening' | 'processing' | 'responding' | 'error'
  showPulse?: boolean
}) {
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
    <div
      className={`
        relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all
        ${isActive
          ? 'bg-rose-500 text-white'
          : 'bg-white text-gray-700 border border-gray-200'
        }
        ${state === 'listening' && showPulse ? 'animate-pulse' : ''}
      `}
    >
      {getIcon()}
      {state === 'listening' && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-25" />
          <span className="absolute -inset-1 rounded-full animate-pulse bg-rose-300 opacity-20" />
        </>
      )}
    </div>
  )
}

// All states mockup
export const AllStates = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-5xl mx-auto space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Voice Modal - All States</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The voice modal flows through these states during a session
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* 1. Idle State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">1</span>
              Idle State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="idle" />
                  <p className="text-sm text-center text-muted-foreground">
                    Click to start recording
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Connecting State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">2</span>
              Connecting State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="connecting" />
                  <p className="text-sm text-center text-muted-foreground">
                    Connecting to voice assistant...
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Listening State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">3</span>
              Listening State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="listening" showPulse />
                  <p className="text-sm text-center text-muted-foreground">
                    Listening... Tell me about your training session!
                  </p>

                  {/* Audio visualization bars */}
                  <div className="flex gap-1">
                    {[12, 18, 24, 16, 20].map((height, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                        style={{ height: `${height}px`, animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Transcript */}
                <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                  <p className="text-sm">That felt really good today, I managed to do the full 5k in about 28 minutes...</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Stop Recording</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Processing State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">4</span>
              Processing State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="processing" />
                  <p className="text-sm text-center text-muted-foreground">
                    Processing...
                  </p>
                </div>

                {/* Transcript */}
                <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                  <p className="text-sm">That felt really good today, I managed to do the full 5k in about 28 minutes. My legs felt strong throughout and I kept a steady pace.</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Stop Recording</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Responding State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">5</span>
              Responding State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="responding" />
                  <p className="text-sm text-center text-muted-foreground">
                    Coach is responding...
                  </p>

                  {/* Speaker indicator */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-500">Playing response...</span>
                  </div>
                </div>

                {/* Transcript */}
                <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                  <p className="text-sm">That felt really good today, I managed to do the full 5k in about 28 minutes. My legs felt strong throughout and I kept a steady pace.</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Stop Recording</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Error State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-sm text-destructive">!</span>
              Error State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Voice Assistant</h3>
                  <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

                <div className="flex flex-col items-center gap-6 py-8">
                  <MockFloatingVoiceButton state="error" />
                  <p className="text-sm text-center text-destructive">
                    Connection failed. Click to try again.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Cancel</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Confirmation State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-sm text-green-600">✓</span>
              Confirmation State
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Confirm Workout Details</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="text-lg font-semibold">5.2 km</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="text-lg font-semibold">28 min</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Effort (RPE)</div>
                    <div className="text-lg font-semibold">7/10</div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="text-sm">Felt really good today. Legs felt strong throughout.</div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">Edit</Button>
                  <Button className="flex-1">Confirm</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Voice Not Supported State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-sm text-destructive">✗</span>
              Voice Not Supported
            </h3>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="text-lg font-semibold">Voice Not Supported</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your browser does not support voice features. Please use a modern browser like Chrome, Firefox, or Safari.
                </p>
                <div className="flex justify-end">
                  <Button variant="outline">Close</Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  ),
} as unknown as Story

// Keep the old CurrentDesign for backwards compatibility but mark it as deprecated
export const CurrentDesign = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Voice Modal Design (Legacy View)</h2>
        <p className="text-sm text-muted-foreground mb-6">
          See "All States" story for the complete current implementation
        </p>

        {/* Idle State */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Idle State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voice Assistant</h3>
                <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

              <div className="flex flex-col items-center gap-6 py-8">
                <MockFloatingVoiceButton state="idle" />
                <p className="text-sm text-center text-muted-foreground">
                  Click to start recording
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Listening State */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Listening State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voice Assistant</h3>
                <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">30 Minute Easy Run - 5 km</p>

              <div className="flex flex-col items-center gap-6 py-8">
                <MockFloatingVoiceButton state="listening" showPulse />
                <p className="text-sm text-center text-muted-foreground">
                  Listening... Tell me about your workout!
                </p>

                <div className="flex gap-1">
                  {[12, 18, 24, 16, 20].map((height, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Transcript:</p>
                <p className="text-sm">That felt really good today, I managed to do the full 5k in about 28 minutes...</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Stop Recording</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation State */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Confirmation State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Confirm Workout Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Distance</div>
                  <div className="text-lg font-semibold">5.2 km</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-lg font-semibold">28 min</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Effort (RPE)</div>
                  <div className="text-lg font-semibold">7/10</div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">Felt really good today. Legs felt strong throughout.</div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">Edit</Button>
                <Button className="flex-1">Confirm</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
} as unknown as Story
