import type { Meta, StoryObj } from '@storybook/react';
import { HormoneCycleChart } from './HormoneCycleChart';

const meta = {
  title: 'Components/HormoneCycleChart',
  component: HormoneCycleChart,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive hormone cycle chart with split-view design that visualizes the four phases of the menstrual cycle (Menstruation, Follicular Phase, Ovulation, and Luteal Phase) along with the fluctuations of key hormones (Estrogen, Progesterone, FSH, and LH) across a 28-day cycle. Features side-by-side phase views with overlay indicators for menstruation and ovulation.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HormoneCycleChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const MenstruationPhase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Showing the chart during the menstruation phase (Days 1-5) with low hormone levels.',
      },
    },
  },
};

export const FollicularPhase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Follicular phase (Days 6-13) showing rising estrogen levels as the body prepares for ovulation.',
      },
    },
  },
};

export const OvulationPhase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Ovulation phase (Days 14-16) featuring peak estrogen and the LH surge that triggers ovulation.',
      },
    },
  },
};

export const LutealPhase: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Luteal phase (Days 17-28) with elevated progesterone levels preparing the body for potential pregnancy.',
      },
    },
  },
};

export const EndOfCycle: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'End of the cycle (Day 27) showing declining hormone levels as the next menstruation approaches.',
      },
    },
  },
};

export const CustomDate: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Example with a custom date configuration.',
      },
    },
  },
};

export const WithCustomBackground: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="bg-gray-100 p-8">
        <Story />
      </div>
    ),
  ],
};

export const Responsive: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
