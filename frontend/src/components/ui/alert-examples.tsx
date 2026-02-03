/**
 * Alert Component Usage Examples
 *
 * This file demonstrates how to use the Alert component and Toast system
 * for displaying error messages throughout the app.
 */

import { useToast } from '@/contexts/ToastContext'
import { Alert, AlertTitle, AlertDescription } from './alert'

export function AlertExamples() {
  const toast = useToast()

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Toast Notifications (Recommended for errors)</h2>
        <p className="mb-4 text-gray-600">
          Use the toast system to show temporary error messages that auto-dismiss.
        </p>

        <div className="space-x-2">
          <button
            onClick={() => toast.error('This file contain virus')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Show Error Toast
          </button>

          <button
            onClick={() => toast.error(
              'Upload failed',
              'The file you tried to upload is corrupted or contains malicious content.'
            )}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Error with Description
          </button>

          <button
            onClick={() => toast.success('File uploaded successfully')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Show Success Toast
          </button>

          <button
            onClick={() => toast.warning('This action cannot be undone')}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Show Warning Toast
          </button>

          <button
            onClick={() => toast.info('Your session will expire in 5 minutes')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Show Info Toast
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Inline Alerts</h2>
        <p className="mb-4 text-gray-600">
          Use inline alerts for persistent error messages in forms or specific sections.
        </p>

        <div className="space-y-4 max-w-2xl">
          <Alert variant="error">
            <AlertTitle>This file contain virus</AlertTitle>
          </Alert>

          <Alert variant="error" onClose={() => console.log('Alert closed')}>
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>
              The file you tried to upload is corrupted or contains malicious content.
              Please try again with a different file.
            </AlertDescription>
          </Alert>

          <Alert variant="success">
            <AlertTitle>Profile updated successfully</AlertTitle>
            <AlertDescription>
              Your changes have been saved and will be visible immediately.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTitle>Account expiring soon</AlertTitle>
            <AlertDescription>
              Your trial period ends in 3 days. Upgrade to continue using all features.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <AlertTitle>New feature available</AlertTitle>
            <AlertDescription>
              Check out our new training analytics dashboard in the settings menu.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Usage in Code</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`// In any component:
import { useToast } from '@/contexts/ToastContext'

function MyComponent() {
  const toast = useToast()

  const handleUpload = async () => {
    try {
      await uploadFile()
      toast.success('File uploaded successfully')
    } catch (error) {
      toast.error('This file contain virus')
    }
  }

  return <button onClick={handleUpload}>Upload</button>
}

// For inline alerts in forms:
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

<Alert variant="error">
  <AlertTitle>Invalid email</AlertTitle>
  <AlertDescription>Please enter a valid email address</AlertDescription>
</Alert>`}
        </pre>
      </div>
    </div>
  )
}

// Quick reference for API endpoints error handling
export function handleApiError(error: any, toast: ReturnType<typeof useToast>) {
  if (error.response?.status === 401) {
    toast.error('Session expired', 'Please log in again to continue.')
  } else if (error.response?.status === 403) {
    toast.error('Access denied', 'You do not have permission to perform this action.')
  } else if (error.response?.status === 404) {
    toast.error('Not found', 'The requested resource could not be found.')
  } else if (error.response?.status >= 500) {
    toast.error('Server error', 'Something went wrong on our end. Please try again later.')
  } else {
    toast.error('An error occurred', error.message || 'Please try again.')
  }
}
