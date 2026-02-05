import type { Meta, StoryObj } from '@storybook/react-vite'
import { Login } from '@/pages/Login'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { HormoneWaveBackground } from '@/components/HormoneWaveBackground'

const meta = {
  title: 'Auth/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Login page for HerPace. Users can sign in with their email and password. Includes validation, error handling, and a link to the signup page.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Login>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default login page with email and password fields. Users can sign in or navigate to the signup page.',
      },
    },
  },
}

export const GradientBlobs: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden">
        {/* Cycle phase color blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-15" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-200 rounded-full blur-3xl opacity-15" />
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with soft gradient blobs using cycle phase colors (orange/ovulatory, green/follicular, purple/luteal, cyan/menstrual)',
      },
    },
  },
}

export const WavePattern: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden">
        {/* Wave layers at bottom */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(251, 146, 60, 0.1)" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,165.3C672,160,768,96,864,90.7C960,85,1056,139,1152,144C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          <path fill="rgba(34, 197, 94, 0.1)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with flowing wave pattern at bottom using ovulatory (orange) and follicular (green) colors',
      },
    },
  },
}

export const CircularRings: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden">
        {/* Circular rings representing cycle phases */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[40px] border-red-200/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[40px] border-green-200/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[40px] border-orange-200/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border-[40px] border-purple-200/20 rounded-full" />
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with concentric circular rings representing the four cycle phases (red/menstrual outer, green/follicular, orange/ovulatory, purple/luteal inner)',
      },
    },
  },
}

export const MeshGradient: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-green-50 via-orange-50 to-purple-50">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with mesh gradient transitioning through all cycle phase colors (cyan→green→orange→purple)',
      },
    },
  },
}

export const AsymmetricBlocks: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden">
        {/* Asymmetric color blocks */}
        <div className="absolute top-0 right-0 w-1/3 h-2/3 bg-orange-100/40" />
        <div className="absolute bottom-0 left-0 w-2/5 h-1/2 bg-green-100/40" />
        <div className="absolute top-1/4 right-1/3 w-1/4 h-1/3 bg-purple-100/30" />
        <div className="absolute bottom-1/3 left-1/4 w-1/5 h-1/4 bg-cyan-100/30" />
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with asymmetric color blocks in cycle phase colors positioned behind the form',
      },
    },
  },
}

export const SubtleGlow: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden">
        {/* Radial gradient glow from center */}
        <div className="absolute inset-0 bg-gradient-radial from-orange-100/30 via-transparent to-transparent" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.15) 0%, transparent 70%)'
        }} />
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with subtle radial glow in ovulatory orange behind the form',
      },
    },
  },
}

export const HormoneWaves: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <HormoneWaveBackground opacity={0.3} />
        <div className="relative z-10">
          <style>{`
            /* Override the page wrapper background to be transparent */
            .min-h-screen.bg-background {
              background: transparent !important;
            }
          `}</style>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Login page with hormone wave curves from the cycle chart as background. Uses the same four hormone colors: estrogen (golden), progesterone (burgundy), FSH (olive), and LH (blue).',
      },
    },
  },
}
