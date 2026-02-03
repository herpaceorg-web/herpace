import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning', 'info'],
      description: 'The visual style variant of the alert',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when close button is clicked',
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Error: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="error">
        <AlertTitle>This file contain virus</AlertTitle>
      </Alert>
    </div>
  ),
}

export const ErrorWithDescription: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="error">
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>
          The file you tried to upload is corrupted or contains malicious content.
          Please try again with a different file.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const ErrorWithCloseButton: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="error" onClose={() => alert('Alert closed!')}>
        <AlertTitle>This file contain virus</AlertTitle>
        <AlertDescription>
          The file has been quarantined and removed from your uploads.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const Success: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="success">
        <AlertTitle>File uploaded successfully</AlertTitle>
        <AlertDescription>
          Your training plan has been saved and is now available in your dashboard.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const Warning: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="warning">
        <AlertTitle>This action cannot be undone</AlertTitle>
        <AlertDescription>
          Deleting your training plan will permanently remove all associated data.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const Info: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="info">
        <AlertTitle>Your session will expire in 5 minutes</AlertTitle>
        <AlertDescription>
          Please save your work to avoid losing any changes.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const Default: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args}>
        <AlertTitle>Update available</AlertTitle>
        <AlertDescription>
          A new version of the app is available. Refresh to update.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const TitleOnly: Story = {
  render: (args) => (
    <div className="w-[500px]">
      <Alert {...args} variant="error">
        <AlertTitle>This file contain virus</AlertTitle>
      </Alert>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Alert variant="error">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>This file contain virus</AlertDescription>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your changes have been saved successfully</AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This action requires confirmation</AlertDescription>
      </Alert>

      <Alert variant="info">
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Your session will expire soon</AlertDescription>
      </Alert>

      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>This is a default alert message</AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}

export const WithCloseButtons: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <Alert variant="error" onClose={() => console.log('Error alert closed')}>
        <AlertTitle>This file contain virus</AlertTitle>
        <AlertDescription>
          The file has been quarantined for your protection.
        </AlertDescription>
      </Alert>

      <Alert variant="success" onClose={() => console.log('Success alert closed')}>
        <AlertTitle>Training plan created</AlertTitle>
        <AlertDescription>
          Your personalized plan is ready to view.
        </AlertDescription>
      </Alert>

      <Alert variant="warning" onClose={() => console.log('Warning alert closed')}>
        <AlertTitle>Account expiring soon</AlertTitle>
        <AlertDescription>
          Renew your subscription to continue accessing all features.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}
