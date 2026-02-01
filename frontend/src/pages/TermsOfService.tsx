import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function TermsOfService() {
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
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Agreement to Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using Her Pace ("the Service"), you agree to be bound by these Terms of Service ("Terms").
                If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                Her Pace is a hormone-aware training plan application designed for women runners. The Service provides:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>AI-generated personalized training plans</li>
                <li>Cycle phase tracking and adaptation</li>
                <li>Workout scheduling and tracking</li>
                <li>Race preparation guidance</li>
                <li>Progress monitoring and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">User Accounts</h2>

              <h3 className="text-lg font-medium mb-2 mt-4">Account Creation</h3>
              <p className="text-muted-foreground mb-4">
                To use Her Pace, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as needed</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Account Eligibility</h3>
              <p className="text-muted-foreground mb-4">
                You must be at least 13 years old to use Her Pace. If you are under 18, you must have parental or
                guardian consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Use the Service for any illegal purpose or violate any laws</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Upload viruses, malware, or other malicious code</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Scrape, spider, or crawl the Service</li>
                <li>Reverse engineer or decompile any part of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Medical Disclaimer</h2>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p className="text-muted-foreground font-medium mb-2">
                  ⚠️ IMPORTANT: Her Pace is NOT a medical device or healthcare service.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Training plans are for informational and educational purposes only</li>
                  <li>Always consult with a healthcare provider before starting any exercise program</li>
                  <li>We do not provide medical advice, diagnosis, or treatment</li>
                  <li>Listen to your body and seek medical attention for any health concerns</li>
                  <li>Results may vary; we do not guarantee specific outcomes</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service, including its original content, features, and functionality, is owned by Her Pace and
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground mb-4">
                Your training data and personal information remain yours. By using the Service, you grant us a license
                to use this data to provide and improve the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Payment & Subscriptions</h2>
              <p className="text-muted-foreground mb-4">
                <em>Note: Payment terms will be added when subscription features are implemented.</em>
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Subscription fees are charged in advance on a recurring basis</li>
                <li>Cancellations take effect at the end of the current billing period</li>
                <li>No refunds for partial subscription periods</li>
                <li>Prices are subject to change with notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, HER PACE SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or goodwill</li>
                <li>Service interruptions or data loss</li>
                <li>Injuries or health issues arising from training</li>
                <li>Reliance on AI-generated training plans</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                Our total liability shall not exceed the amount you paid for the Service in the past 12 months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
              <p className="text-muted-foreground mb-4">
                You agree to indemnify and hold harmless Her Pace from any claims, damages, losses, liabilities, and
                expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Termination</h2>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for any reason, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended inactivity</li>
                <li>Request by law enforcement or government</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                You may delete your account at any time from your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of material changes via
                email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
                without regard to conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms, please contact us:
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> legal@herpace.com
              </p>
              <p className="text-muted-foreground">
                <strong>Address:</strong> Her Pace Legal Team, [Your Address]
              </p>
            </section>

            <section className="mb-4">
              <p className="text-sm text-muted-foreground italic">
                By clicking "I agree" during signup, you acknowledge that you have read, understood, and agree to be
                bound by these Terms of Service.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
