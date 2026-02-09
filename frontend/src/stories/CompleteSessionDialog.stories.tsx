import type { Meta, StoryObj } from '@storybook/react-vite'
import { CompleteSessionDialog } from '@/components/session/CompleteSessionDialog'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { Mic, Loader2, CheckCircle } from 'lucide-react'

const meta = {
  title: 'Components/Session/CompleteSessionDialog',
  component: CompleteSessionDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CompleteSessionDialog>

export default meta
type Story = StoryObj<typeof meta>

// Design mockup showing integrated voice feature - matches current implementation
export const AllStates = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-5xl mx-auto space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Complete Session Dialog - All States</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Voice input is integrated directly into the session completion flow
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* State 1: Initial - Choose Input Method */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">1</span>
              Initial - Choose Input Method
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Voice button is prominent, manual form below
            </p>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                  <p className="text-sm font-normal text-muted-foreground">How did your 30 Minute Easy Run go?</p>
                </div>

                {/* Voice Option */}
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center cursor-pointer transition-colors mb-4">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-sm font-normal text-foreground mb-1">Chat about your training session</h4>
                    <p className="text-sm font-normal text-muted-foreground mb-4">
                      Tell me how it went and I'll log the details for you
                    </p>

                    {/* Example phrases */}
                    <div className="w-full space-y-2">
                      <p className="text-xs text-muted-foreground font-normal">Try saying something like:</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                          "I ran 3 miles in 28 minutes"
                        </span>
                        <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                          "It felt like a 7 out of 10"
                        </span>
                        <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                          "My legs were a bit tired today"
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground font-normal">or enter manually</span>
                  </div>
                </div>

                {/* Manual Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-foreground">Distance</label>
                    <NumberInput
                      value={3.1}
                      min={0}
                      max={100}
                      step={0.1}
                      suffix="mi"
                    />
                    <p className="text-xs text-muted-foreground">Planned: 3.1 mi</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-foreground">Duration</label>
                    <NumberInput
                      value={30}
                      min={0}
                      max={300}
                      step={1}
                      suffix="min"
                    />
                    <p className="text-xs text-muted-foreground">Planned: 30 min</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-foreground">How did the training session feel?</label>
                    <NumberInput
                      value={5}
                      min={1}
                      max={10}
                      step={1}
                      suffix="/10"
                    />
                    <p className="text-xs text-muted-foreground">1 (very easy) - 10 (maximum effort)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-normal text-foreground">Notes (optional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[60px]"
                      placeholder="How did you feel? Any issues?"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">Cancel</Button>
                  <Button className="flex-1">Save Training Session</Button>
                </div>
              </div>
            </div>
          </div>

          {/* State 2: Voice Connecting */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">2</span>
              Voice - Connecting
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Connecting to voice assistant
            </p>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                  <p className="text-sm font-normal text-muted-foreground">30 Minute Easy Run</p>
                </div>

                {/* Connecting State */}
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center mb-4 opacity-50">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h4 className="text-sm font-normal text-foreground mb-1">Connecting to voice assistant...</h4>
                    <p className="text-sm font-normal text-muted-foreground">
                      Click the microphone to start
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">Cancel</Button>
                  <Button className="flex-1" disabled>Save Training Session</Button>
                </div>
              </div>
            </div>
          </div>

          {/* State 3: Voice Listening */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">3</span>
              Voice - Listening
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Recording with live transcript
            </p>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                  <p className="text-sm font-normal text-muted-foreground">30 Minute Easy Run</p>
                </div>

                {/* Listening State */}
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center animate-pulse cursor-pointer">
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <h4 className="text-sm font-normal text-foreground mb-1">I'm listening...</h4>
                    <p className="text-sm font-normal text-muted-foreground mb-4">
                      Tell me about your training session
                    </p>

                    {/* Audio bars */}
                    <div className="flex gap-1 mb-4">
                      {[12, 18, 24, 16, 20].map((height, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                          style={{ height: `${height}px`, animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>

                    {/* Transcript */}
                    <div className="bg-card/80 rounded-lg p-3 text-left w-full">
                      <p className="text-sm text-muted-foreground font-normal">Transcript:</p>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        "That felt really good today, I managed to do the full 5k in about 28 minutes..."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">Cancel</Button>
                  <Button className="flex-1" disabled>Save Training Session</Button>
                </div>
              </div>
            </div>
          </div>

          {/* State 4: Voice Processing */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">4</span>
              Voice - Processing
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              AI extracting session details
            </p>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                  <p className="text-sm font-normal text-muted-foreground">30 Minute Easy Run</p>
                </div>

                {/* Processing State */}
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center mb-4">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h4 className="text-sm font-normal text-foreground mb-1">Analyzing your session...</h4>
                    <p className="text-sm font-normal text-muted-foreground mb-4">
                      Extracting distance, duration, and effort details
                    </p>

                    {/* Transcript */}
                    <div className="bg-card/80 rounded-lg p-3 text-left w-full">
                      <p className="text-sm text-muted-foreground font-normal">Transcript:</p>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        "That felt really good today, I managed to do the full 5k in about 28 minutes. My legs felt strong and I'd say it was about a 7 out of 10 effort."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">Cancel</Button>
                  <Button className="flex-1" disabled>Save Training Session</Button>
                </div>
              </div>
            </div>
          </div>

          {/* State 5: Review & Confirm */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-sm text-green-600">✓</span>
              Confirmation - Review & Save
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              AI extracted data displayed for confirmation
            </p>
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg max-w-[600px]">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                  <p className="text-sm font-normal text-muted-foreground">30 Minute Easy Run</p>
                </div>

                {/* Extracted Data Review */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="text-sm font-normal text-foreground">Review your session details</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-card p-3 rounded-md">
                      <div className="text-xs text-muted-foreground">Distance</div>
                      <div className="text-lg font-semibold">3.1 mi</div>
                    </div>
                    <div className="bg-card p-3 rounded-md">
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="text-lg font-semibold">28 min</div>
                    </div>
                    <div className="bg-card p-3 rounded-md col-span-2">
                      <div className="text-xs text-muted-foreground">Effort (RPE)</div>
                      <div className="text-lg font-semibold">7/10</div>
                    </div>
                  </div>

                  <div className="bg-card p-3 rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                    <div className="text-sm text-foreground">Felt strong throughout, maintained good pace. Legs felt great.</div>
                  </div>
                </div>

                {/* Edit option */}
                <div className="text-center">
                  <button className="text-sm text-muted-foreground hover:text-foreground font-normal">
                    Edit manually instead
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">Cancel</Button>
                  <Button className="flex-1">Confirm & Save</Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  ),
} as unknown as Story

// Voice Not Supported state
export const VoiceNotSupported = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-[600px] mx-auto">
      <h3 className="text-lg font-semibold mb-3">Voice Not Supported</h3>
      <p className="text-sm text-muted-foreground mb-4">
        When browser doesn't support voice, show manual form only
      </p>
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
            <p className="text-sm font-normal text-muted-foreground">How did your 30 Minute Easy Run go?</p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">Voice chat unavailable</h4>
            <p className="text-sm text-yellow-800">
              Your browser may not support voice features. Please use a modern browser like Chrome or Firefox.
            </p>
          </div>

          {/* Manual Form Only */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-normal text-foreground">Distance</label>
              <NumberInput
                value={3.1}
                min={0}
                max={100}
                step={0.1}
                suffix="mi"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-normal text-foreground">Duration</label>
              <NumberInput
                value={30}
                min={0}
                max={300}
                step={1}
                suffix="min"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-normal text-foreground">How did the training session feel?</label>
              <NumberInput
                value={5}
                min={1}
                max={10}
                step={1}
                suffix="/10"
              />
              <p className="text-xs text-muted-foreground">1 (very easy) - 10 (maximum effort)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-normal text-foreground">Notes (optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[60px]"
                placeholder="How did you feel?"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1">Cancel</Button>
            <Button className="flex-1">Save Training Session</Button>
          </div>
        </div>
      </div>
    </div>
  ),
} as unknown as Story

// Keep legacy for reference
export const IntegratedVoiceDesign = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> See "All States" story for the updated view matching the current implementation.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Complete Session Dialog Flow</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The voice feature is integrated directly into the Complete Session modal, not as a separate voice modal.
          </p>
        </div>

        {/* State 1: Initial */}
        <div>
          <h3 className="text-lg font-semibold mb-4">State 1: Initial - Choose Input Method</h3>
          <div className="bg-card border border-border rounded-lg p-6 max-w-[600px] shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="font-petrona text-2xl font-normal text-foreground mb-1">Complete Training Session</h3>
                <p className="text-sm font-normal text-muted-foreground">How did your 30 Minute Easy Run go?</p>
              </div>

              <div className="bg-muted rounded-lg p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center cursor-pointer transition-colors mb-4">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-sm font-normal text-foreground mb-1">Chat about your training session</h4>
                  <p className="text-sm font-normal text-muted-foreground mb-4">
                    Tell me how it went and I'll log the details for you
                  </p>

                  {/* Example phrases */}
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground font-normal">Try saying something like:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                        "I ran 3 miles in 28 minutes"
                      </span>
                      <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                        "It felt like a 7 out of 10"
                      </span>
                      <span className="text-xs bg-card px-3 py-1.5 rounded-full text-muted-foreground border border-border">
                        "My legs were a bit tired today"
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground font-normal">or enter manually</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-normal text-foreground">Distance</label>
                  <NumberInput value={3.1} min={0} max={100} step={0.1} suffix="mi" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-normal text-foreground">Duration</label>
                  <NumberInput value={30} min={0} max={300} step={1} suffix="min" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-normal text-foreground">How did the training session feel?</label>
                  <NumberInput value={5} min={1} max={10} step={1} suffix="/10" />
                  <p className="text-xs text-muted-foreground">1 (very easy) - 10 (maximum effort)</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">Cancel</Button>
                <Button className="flex-1">Save Training Session</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
} as unknown as Story
