import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">משהו השתבש</h2>
            <p className="text-sm text-muted-foreground mb-6">אירעה שגיאה בלתי צפויה. נסו לרענן את הדף.</p>
            <Button onClick={() => window.location.reload()} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              רענן דף
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
