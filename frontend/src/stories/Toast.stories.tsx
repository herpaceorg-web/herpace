import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { ToastContainer } from '@/components/ui/toast-container'

const ToastDemo = () => {
  const toast = useToast()

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <p className="text-gray-600 mb-6">
        Click the buttons below to trigger different toast notifications.
        They will appear in the top-right corner and auto-dismiss after 5 seconds.
      </p>

      <div className="space-y-3">
        <div>
          <button
            onClick={() => toast.error('This file contain virus')}
            className="px-4 py-2 bg-[#A14139] text-white rounded-lg hover:bg-[#8B3830] transition-colors"
          >
            Show Error Toast
          </button>
          <p className="text-sm text-gray-500 mt-1">Simple error message</p>
        </div>

        <div>
          <button
            onClick={() =>
              toast.error(
                'Upload failed',
                'The file you tried to upload is corrupted or contains malicious content.'
              )
            }
            className="px-4 py-2 bg-[#A14139] text-white rounded-lg hover:bg-[#8B3830] transition-colors"
          >
            Error with Description
          </button>
          <p className="text-sm text-gray-500 mt-1">Error with detailed description</p>
        </div>

        <div>
          <button
            onClick={() => toast.success('File uploaded successfully')}
            className="px-4 py-2 bg-[#677344] text-white rounded-lg hover:bg-[#566030] transition-colors"
          >
            Show Success Toast
          </button>
          <p className="text-sm text-gray-500 mt-1">Success notification</p>
        </div>

        <div>
          <button
            onClick={() =>
              toast.success(
                'Training plan created',
                'Your personalized training plan is ready to view in your dashboard.'
              )
            }
            className="px-4 py-2 bg-[#677344] text-white rounded-lg hover:bg-[#566030] transition-colors"
          >
            Success with Description
          </button>
          <p className="text-sm text-gray-500 mt-1">Success with details</p>
        </div>

        <div>
          <button
            onClick={() => toast.warning('This action cannot be undone')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Show Warning Toast
          </button>
          <p className="text-sm text-gray-500 mt-1">Warning message</p>
        </div>

        <div>
          <button
            onClick={() =>
              toast.warning(
                'Account expiring soon',
                'Your trial period ends in 3 days. Upgrade to continue using all features.'
              )
            }
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Warning with Description
          </button>
          <p className="text-sm text-gray-500 mt-1">Warning with details</p>
        </div>

        <div>
          <button
            onClick={() => toast.info('Your session will expire in 5 minutes')}
            className="px-4 py-2 bg-[#4E6D80] text-white rounded-lg hover:bg-[#3D5665] transition-colors"
          >
            Show Info Toast
          </button>
          <p className="text-sm text-gray-500 mt-1">Information message</p>
        </div>

        <div>
          <button
            onClick={() =>
              toast.info(
                'New feature available',
                'Check out our new training analytics dashboard in the settings menu.'
              )
            }
            className="px-4 py-2 bg-[#4E6D80] text-white rounded-lg hover:bg-[#3D5665] transition-colors"
          >
            Info with Description
          </button>
          <p className="text-sm text-gray-500 mt-1">Info with details</p>
        </div>

        <div className="pt-4 border-t">
          <button
            onClick={() => {
              toast.error('Error 1: This file contain virus')
              setTimeout(() => toast.warning('Warning: Please verify your files'), 500)
              setTimeout(() => toast.success('Success: Previous files are safe'), 1000)
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Show Multiple Toasts
          </button>
          <p className="text-sm text-gray-500 mt-1">Trigger multiple notifications at once</p>
        </div>

        <div>
          <button
            onClick={() =>
              toast.addToast({
                variant: 'error',
                title: 'This notification never dismisses',
                description: 'You must close it manually',
                duration: 0,
              })
            }
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Persistent Toast (No Auto-Dismiss)
          </button>
          <p className="text-sm text-gray-500 mt-1">Must be manually closed</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Usage in Code:</h3>
        <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`import { useToast } from '@/contexts/ToastContext'

function MyComponent() {
  const toast = useToast()

  const handleError = () => {
    toast.error('This file contain virus')
  }

  const handleSuccess = () => {
    toast.success('File uploaded successfully')
  }

  return <button onClick={handleError}>Upload</button>
}`}
        </pre>
      </div>
    </div>
  )
}

const meta = {
  title: 'Components/Toast',
  component: ToastDemo,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <ToastContainer />
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ToastDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {}
