import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-surface gap-5">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-error" />
          </div>
          <div className="text-center">
            <h2 className="text-[18px] font-semibold text-text-primary mb-1.5">
              Something went wrong
            </h2>
            <p className="text-[13px] text-text-tertiary max-w-[320px] leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="
              flex items-center gap-2 px-4 py-2.5
              rounded-[--radius-md]
              bg-accent text-white
              text-[13px] font-medium
              hover:bg-accent-hover transition-colors
              cursor-pointer
            "
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
