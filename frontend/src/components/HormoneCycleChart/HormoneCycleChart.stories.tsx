import type { Meta, StoryObj } from '@storybook/react';
import { HormoneCycleChart } from './HormoneCycleChart';
import { CyclePhase } from '@/types/api';

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

// Mock handler for period logging
const mockOnPeriodLogged = () => {
  console.log('Period logged');
};

export const Default: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 1,
      cycleLength: 28,
      currentPhase: CyclePhase.Menstrual,
      lastPeriodStart: new Date().toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 28,
      phaseDescription: 'Menstrual Phase',
      phaseGuidance: 'Rest and recovery period',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
};

export const MenstruationPhase: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 3,
      cycleLength: 28,
      currentPhase: CyclePhase.Menstrual,
      lastPeriodStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 26,
      phaseDescription: 'Menstrual Phase',
      phaseGuidance: 'Rest and recovery period',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'Showing the chart during the menstruation phase (Days 1-5) with low hormone levels.',
      },
    },
  },
};

export const FollicularPhase: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 10,
      cycleLength: 28,
      currentPhase: CyclePhase.Follicular,
      lastPeriodStart: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 19,
      phaseDescription: 'Follicular Phase',
      phaseGuidance: 'Rising energy levels',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'Follicular phase (Days 6-13) showing rising estrogen levels as the body prepares for ovulation.',
      },
    },
  },
};

export const OvulationPhase: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 14,
      cycleLength: 28,
      currentPhase: CyclePhase.Ovulatory,
      lastPeriodStart: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 15,
      phaseDescription: 'Ovulatory Phase',
      phaseGuidance: 'Peak energy and performance',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ovulation phase (Days 14-16) featuring peak estrogen and the LH surge that triggers ovulation.',
      },
    },
  },
};

export const LutealPhase: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 22,
      cycleLength: 28,
      currentPhase: CyclePhase.Luteal,
      lastPeriodStart: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 7,
      phaseDescription: 'Luteal Phase',
      phaseGuidance: 'Moderate activity recommended',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'Luteal phase (Days 17-28) with elevated progesterone levels preparing the body for potential pregnancy.',
      },
    },
  },
};

export const EndOfCycle: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 27,
      cycleLength: 28,
      currentPhase: CyclePhase.Luteal,
      lastPeriodStart: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 2,
      phaseDescription: 'Luteal Phase',
      phaseGuidance: 'Period approaching',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'End of the cycle (Day 27) showing declining hormone levels as the next menstruation approaches.',
      },
    },
  },
};

export const CustomDate: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 15,
      cycleLength: 30,
      currentPhase: CyclePhase.Ovulatory,
      lastPeriodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 16,
      phaseDescription: 'Ovulatory Phase',
      phaseGuidance: 'Peak energy and performance',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with a custom date configuration.',
      },
    },
  },
};

export const WithCustomBackground: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 1,
      cycleLength: 28,
      currentPhase: CyclePhase.Menstrual,
      lastPeriodStart: new Date().toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 28,
      phaseDescription: 'Menstrual Phase',
      phaseGuidance: 'Rest and recovery period',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
};

export const Responsive: Story = {
  args: {
    cyclePosition: {
      currentDayInCycle: 1,
      cycleLength: 28,
      currentPhase: CyclePhase.Menstrual,
      lastPeriodStart: new Date().toISOString(),
      nextPredictedPeriod: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilNextPeriod: 28,
      phaseDescription: 'Menstrual Phase',
      phaseGuidance: 'Rest and recovery period',
    },
    onPeriodLogged: mockOnPeriodLogged,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
