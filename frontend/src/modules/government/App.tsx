import { ThemeProvider } from '@/context/ThemeContext'
import { AccessibilityProvider } from '@/context/AccessibilityContext'
import { I18nProvider } from '@/context/I18nContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { AppRoutes } from '@/routes'

/**
 * App root — provider composition order matters: theme/a11y first (root
 * classes), then i18n (language attribute), then auth/toasts/notifications.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <I18nProvider>
          <AuthProvider>
            <NotificationsProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </ToastProvider>
            </NotificationsProvider>
          </AuthProvider>
        </I18nProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  )
}
