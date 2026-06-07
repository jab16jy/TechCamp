import React, { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(
      `[ErrorBoundary] Crash en "${this.props.label}":`,
      error?.message || error,
      info?.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error
        ? (this.state.error.message || String(this.state.error).slice(0, 120))
        : "";

      return (
        <div className="bg-white/90 backdrop-blur-md border border-[#DCE0DC] rounded-2xl shadow-lg p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3A3D3A]">
                Error en: <span className="text-[#1A1C1A]">{this.props.label || "componente"}</span>
              </p>
              {errMsg && (
                <p className="text-xs text-[#707973] mt-1 max-w-sm break-all">
                  {errMsg}
                </p>
              )}
            </div>
            {this.props.onRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full transition-colors"
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
