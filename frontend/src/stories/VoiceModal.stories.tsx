import type { Meta, StoryObj } from '@storybook/react-vite'
import { VoiceModal } from '@/components/voice/VoiceModal'
import { WorkoutType, IntensityLevel, CyclePhase } from '@/types/api'
import type { VoiceSessionContextDto } from '@/types/voice'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
  workoutType: WorkoutType.EasyRun,
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

  // Force re-render to show updated component

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

export const Default: Story = {
  render: () => <VoiceModalWrapper sessionContext={mockSessionContext} />,
}

export const WithoutContext: Story = {
  render: () => <VoiceModalWrapper />,
}

// Static mockup showing the modal UI
export const CurrentDesign: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Current Voice Modal Design</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The current implementation as a separate modal
        </p>

        {/* Idle State */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Idle State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voice Assistant</h3>
                <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-[#696863]">30 Minute Easy Run - 5 km</p>

              {/* Voice button and status */}
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm text-center text-[#696863]">
                  Click to start recording
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button className="px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listening State */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Listening State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Voice Assistant</h3>
                <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-[#696863]">30 Minute Easy Run - 5 km</p>

              {/* Voice button and status */}
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm text-center text-[#696863]">
                  Listening... Tell me about your workout!
                </p>

                {/* Animated bars */}
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div className="flex gap-1">
                    {[12, 18, 24, 16, 20].map((height, i) => (
                      <div
                        key={i}
                        className="w-1 bg-rose-500 rounded-full animate-pulse"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="w-full max-h-32 overflow-y-auto bg-muted p-3 rounded-lg">
                <p className="text-sm text-[#696863] mb-1">Transcript:</p>
                <p className="text-sm">That felt really good today, I managed to do the full 5k in about 28 minutes...</p>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button className="px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                  Cancel
                </button>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-normal">
                  Stop Recording
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation State */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Confirmation State</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[500px] shadow-lg">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold">Confirm Workout Details</h3>
              </div>

              {/* Data grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-[#696863]">Distance</div>
                  <div className="text-lg font-semibold">5.2 km</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-[#696863]">Duration</div>
                  <div className="text-lg font-semibold">28 min</div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-[#696863]">Effort (RPE)</div>
                  <div className="text-lg font-semibold">7/10</div>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-[#696863]">Notes</div>
                <div className="text-sm">Felt really good today. Legs felt strong throughout.</div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted font-normal">
                  Edit
                </button>
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-normal">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
