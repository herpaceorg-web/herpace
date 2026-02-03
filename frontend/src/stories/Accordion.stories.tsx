import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is included in the training plan?</AccordionTrigger>
        <AccordionContent>
          Your personalized training plan includes daily workouts, rest days, and adjustments
          based on your menstrual cycle phases. Each session has specific targets and guidance.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How often should I update my cycle data?</AccordionTrigger>
        <AccordionContent>
          Update your cycle start date each month for the most accurate plan adjustments.
          The app will automatically adapt your training based on your current phase.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I modify my training plan?</AccordionTrigger>
        <AccordionContent>
          Yes! You can adjust your race date, experience level, and other preferences at any time.
          The plan will regenerate to match your updated goals.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const TrainingWeek: Story = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="monday">
        <AccordionTrigger>Monday - Easy Run</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="font-semibold">5 km at conversational pace</p>
            <p className="text-sm text-gray-600">
              Keep your heart rate in zone 2. You should be able to hold a conversation
              throughout the run. Focus on maintaining good form.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <div>Duration: 30-35 minutes</div>
              <div>Effort: Easy (RPE 3-4/10)</div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="wednesday">
        <AccordionTrigger>Wednesday - Tempo Run</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="font-semibold">6 km with 3 km tempo section</p>
            <p className="text-sm text-gray-600">
              Warm up for 1.5 km, then run 3 km at comfortably hard pace (you can speak in
              short sentences), followed by 1.5 km cool down.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <div>Duration: 40-45 minutes</div>
              <div>Effort: Moderate to Hard (RPE 6-7/10)</div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="saturday">
        <AccordionTrigger>Saturday - Long Run</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <p className="font-semibold">12 km at easy pace</p>
            <p className="text-sm text-gray-600">
              This is your weekly long run. Maintain an easy, conversational pace throughout.
              Bring water and consider fueling if the run exceeds 90 minutes.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <div>Duration: 70-85 minutes</div>
              <div>Effort: Easy (RPE 4-5/10)</div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const RaceHistory: Story = {
  args: {},
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="race1">
        <AccordionTrigger>
          <div className="flex justify-between w-full pr-4">
            <span>Spring 10K - May 2024</span>
            <span className="text-sm text-gray-500">45:23</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Time:</span> 45:23
              </div>
              <div>
                <span className="text-gray-500">Pace:</span> 4:32/km
              </div>
              <div>
                <span className="text-gray-500">Distance:</span> 10 km
              </div>
              <div>
                <span className="text-gray-500">Place:</span> 23rd
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Great race! Paced it well and finished strong. Weather was perfect.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="race2">
        <AccordionTrigger>
          <div className="flex justify-between w-full pr-4">
            <span>City Half Marathon - March 2024</span>
            <span className="text-sm text-gray-500">1:42:15</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Time:</span> 1:42:15
              </div>
              <div>
                <span className="text-gray-500">Pace:</span> 4:51/km
              </div>
              <div>
                <span className="text-gray-500">Distance:</span> 21.1 km
              </div>
              <div>
                <span className="text-gray-500">Place:</span> 156th
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Personal best! Struggled a bit in the last 5km but pushed through.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
