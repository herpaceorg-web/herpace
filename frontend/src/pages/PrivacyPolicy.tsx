import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/signup">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
                H
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Her Pace</span>
            </div>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Welcome to Her Pace. We are committed to protecting your privacy and ensuring the security of your personal information.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hormone-aware
                training plan application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>

              <h3 className="text-lg font-medium mb-2 mt-4">Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Email address</li>
                <li>Username</li>
                <li>Password (encrypted)</li>
                <li>Date of birth</li>
                <li>Running profile information (fitness level, weekly mileage)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Health & Fitness Data</h3>
              <p className="text-muted-foreground mb-4">
                To provide personalized training plans, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Menstrual cycle information</li>
                <li>Training session data (distance, duration, intensity)</li>
                <li>Race goals and performance metrics</li>
                <li>Workout completion and feedback</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage patterns and app interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Generate personalized, hormone-aware training plans</li>
                <li>Track your progress and adapt recommendations</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and develop new features</li>
                <li>Send important updates about your account or service</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication with encrypted passwords</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure cloud infrastructure (Google Cloud Platform)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share your data only in these circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Service Providers:</strong> With trusted third-party services that help us operate (e.g., Google Cloud, AI services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your personal information for as long as your account is active or as needed to provide services.
                After account deletion, we may retain certain information for legal compliance, dispute resolution, and
                fraud prevention purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Her Pace is not intended for children under 13 years of age. We do not knowingly collect personal information
                from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or
                through a notice in the app. Your continued use of Her Pace after changes constitutes acceptance of the
                updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> privacy@herpace.com
              </p>
              <p className="text-muted-foreground">
                <strong>Address:</strong> Her Pace Privacy Team, [Your Address]
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
