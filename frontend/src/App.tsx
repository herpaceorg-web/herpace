import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { ToastContainer } from '@/components/ui/toast-container'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Onboarding } from '@/pages/Onboarding'
import { Dashboard } from '@/pages/Dashboard'
// Calendar page removed - functionality merged into Dashboard
// import Calendar from '@/pages/Calendar'
// import TrainingHistory from '@/pages/TrainingHistory'
// import RaceDetail from '@/pages/RaceDetail'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'
import { TermsOfService } from '@/pages/TermsOfService'
import { NotFound } from '@/pages/NotFound'
import { ConnectedServices } from '@/pages/ConnectedServices'
import { ImportedActivities } from '@/pages/ImportedActivities'
import { ImportedActivityDetail } from '@/pages/ImportedActivityDetail'
import { RootRedirect } from '@/components/RootRedirect'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ToastContainer />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            {/* Calendar route removed - functionality merged into Dashboard
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Calendar />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            */}
            {/* History routes commented out for hackathon MVP
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TrainingHistory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:raceId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RaceDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="/connected-services"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ConnectedServices />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ImportedActivities />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ImportedActivityDetail />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/calendar" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
