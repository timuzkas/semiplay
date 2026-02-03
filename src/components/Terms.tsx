import { Minimize2, ArrowLeft } from 'lucide-react';

interface TermsProps {
  onClose?: () => void;
  fullPage?: boolean;
}

export function Terms({ onClose, fullPage = false }: TermsProps) {
  const Container = ({ children }: { children: React.ReactNode }) => {
    if (fullPage) {
      return (
        <div className="min-h-screen bg-background text-foreground p-8 md:p-24 max-w-4xl mx-auto">
          <div className="mb-12">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to semiplay
            </a>
          </div>
          {children}
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={onClose}>
        <div 
          className="bg-background border rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto scrollbar-hide shadow-2xl animate-in modal-in"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <Container>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-instrument">Privacy & Terms</h1>
        {onClose && !fullPage && (
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-foreground font-semibold mb-2 text-base">Open Source</h2>
          <p>
            semiplay is an open-source project. The code is available for review, modification, and distribution under its respective license. 
            The service is provided "as-is" without any warranties.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2 text-base">Privacy Policy</h2>
          <p className="mb-4">We store minimal data to provide the best experience:</p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong className="text-foreground">Theme Preferences:</strong> Accent color and dark mode settings are stored locally in your browser.
            </li>
            <li>
              <strong className="text-foreground">Tokens:</strong> Authentication tokens for YouTube and Spotify are stored locally and sent only to those services.
            </li>
            <li>
              <strong className="text-foreground">Room Sync:</strong> Temporary playback data is held in server memory during your session and cleared automatically.
            </li>
            <li>
              <strong className="text-foreground">No Tracking:</strong> We do not use analytics, tracking pixels, or third-party cookies.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mb-2 text-base">Terms of Service</h2>
          <ul className="list-disc pl-5 space-y-3">
            <li>You must follow Spotify's and Google's Terms of Service.</li>
            <li>This tool is for personal use only.</li>
            <li>The developers are not responsible for account issues or suspensions.</li>
          </ul>
        </section>

        <div className="pt-8 border-t text-[10px] opacity-50">
          Last updated: February 2026
        </div>
      </div>
    </Container>
  );
}
