import type { Meta, StoryObj } from '@storybook/react-vite'
import { CycleStep } from '@/components/onboarding/CycleStep'

const meta = {
  title: 'Onboarding/CycleStep',
  component: CycleStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px] max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CycleStep>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
  },
}

export const RegularCycle: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Regular',
      birthControlType: 'None',
      minCycleLength: 27,
      maxCycleLength: 29,
      periodDuration: 5,
      symptomDaysBeforePeriod: 3,
      conditions: [],
      lastPeriodStartDate: new Date(2026, 0, 15), // January 15, 2026
      lastPeriodEndDate: new Date(2026, 0, 20), // January 20, 2026
    },
  },
}

export const IrregularCycle: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Irregular',
      birthControlType: 'None',
      minCycleLength: 28,
      maxCycleLength: 36,
      periodDuration: 6,
      symptomDaysBeforePeriod: 5,
      conditions: [],
      lastPeriodStartDate: new Date(2026, 0, 10), // January 10, 2026
    },
  },
}

export const WithPCOS: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Irregular',
      birthControlType: 'None',
      minCycleLength: 30,
      maxCycleLength: 40,
      periodDuration: 7,
      symptomDaysBeforePeriod: 7,
      conditions: ['PCOS'],
      lastPeriodStartDate: new Date(2026, 0, 5), // January 5, 2026
      lastPeriodEndDate: new Date(2026, 0, 12), // January 12, 2026
    },
  },
}

export const WithEndometriosis: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Regular',
      birthControlType: 'None',
      minCycleLength: 27,
      maxCycleLength: 30,
      periodDuration: 6,
      symptomDaysBeforePeriod: 5,
      conditions: ['Endometriosis', 'PMDD'],
      lastPeriodStartDate: new Date(2026, 0, 10), // January 10, 2026
      lastPeriodEndDate: new Date(2026, 0, 16), // January 16, 2026
    },
  },
}

export const OnHormonalBirthControl: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Regular',
      birthControlType: 'Pill',
      minCycleLength: 28,
      maxCycleLength: 28,
      periodDuration: 3,
      symptomDaysBeforePeriod: 0,
      conditions: [],
      lastPeriodStartDate: new Date(2026, 0, 15), // January 15, 2026
      lastPeriodEndDate: new Date(2026, 0, 18), // January 18, 2026
    },
  },
}

export const OnHormonalIUD: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Irregular',
      birthControlType: 'HormonalIUD',
      minCycleLength: 27,
      maxCycleLength: 32,
      periodDuration: 4,
      symptomDaysBeforePeriod: 2,
      conditions: [],
    },
  },
}

export const Perimenopause: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Irregular',
      birthControlType: 'None',
      minCycleLength: 25,
      maxCycleLength: 38,
      periodDuration: 5,
      symptomDaysBeforePeriod: 10,
      conditions: ['Perimenopause'],
      lastPeriodStartDate: new Date(2025, 11, 20), // December 20, 2025
      lastPeriodEndDate: new Date(2025, 11, 25), // December 25, 2025
    },
  },
}

export const LongerCycle: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'Regular',
      birthControlType: 'None',
      minCycleLength: 33,
      maxCycleLength: 37,
      periodDuration: 5,
      symptomDaysBeforePeriod: 4,
      conditions: [],
      lastPeriodStartDate: new Date(2026, 0, 5), // January 5, 2026
      lastPeriodEndDate: new Date(2026, 0, 11), // January 11, 2026
    },
  },
}

export const PreferNotToShare: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'PreferNotToShare',
      birthControlType: 'None',
      minCycleLength: 27,
      maxCycleLength: 30,
    },
  },
}

export const DoNotTrack: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      cycleRegularity: 'DoNotTrack',
      birthControlType: 'None',
      minCycleLength: 27,
      maxCycleLength: 30,
    },
  },
}
