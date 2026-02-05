import type { Meta, StoryObj } from '@storybook/react-vite'
import { Onboarding } from '@/pages/Onboarding'
import { BrowserRouter } from 'react-router-dom'

const meta = {
  title: 'Pages/Onboarding',
  component: Onboarding,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Onboarding>

export default meta
type Story = StoryObj<typeof meta>

export const AthleteProfile: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The first step of onboarding showing the Athlete Profile form with title and stepper.',
      },
    },
  },
}
