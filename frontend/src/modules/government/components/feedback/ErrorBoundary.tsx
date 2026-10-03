import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorPage } from '@/pages/errors/ErrorPages'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Top-level render-error boundary. A crash in any routed page lands on the
 * institutional 500 screen (same shell as the /error route) instead of
 * blanking the app. Lives inside the provider tree so the error page can
 * still use i18n/theme contexts.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return <ErrorPage error={this.state.error} />
    }
    return this.props.children
  }
}
