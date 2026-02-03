import { Minimize2 } from 'lucide-react';

interface TermsProps {
  onClose: () => void;
}

export function Terms({ onClose }: TermsProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="bg-background border rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto scrollbar-hide shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-instrument">Legal Information</h1>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-foreground font-semibold mb-2">Open Source</h2>
            <p>
              semiplay is an open-source project. The code is available for review, modification, and distribution under its respective license. 
              The service is provided "as-is" without any warranties.
            </p>
          </section>Section

          <section>
            <h2 className="text-foreground font-semibold mb-2">Privacy Policy (What we store)</h2>
            <p className="mb-4">We believe in total transparency. Here is exactly what data is stored 1:1:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Theme Preferences:</strong> Stored in your browser's <code className="text-primary">localStorage</code> to remember your accent color and dark mode settings.
              </li>
              <li>
                <strong className="text-foreground">Authentication Tokens:</strong> YouTube and Spotify access tokens are stored in your browser's <code className="text-primary">localStorage</code>. These are used only to communicate directly with the respective API providers.
              </li>
              <li>
                <strong className="text-foreground">Room Sync State:</strong> When using Room Sync, your current track, playback position, and queue are temporarily stored in the server's <code className="text-primary">volatile memory</code>. This data is never written to a database and is cleared when the server restarts or the room becomes inactive.
              </li>
              <li>
                <strong className="text-foreground">No Analytics:</strong> We do not use tracking cookies, analytics scripts, or third-party data collectors.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-semibold mb-2">Terms of Service</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must comply with Spotify's and Google's Terms of Service while using this application.</li>
              <li>This tool is for personal use only.</li>
              <li>The developers are not responsible for any account suspensions or issues arising from the use of this third-party client.</li>
            </ul>
          </section>

          <div className="pt-4 border-t text-[10px] opacity-50">
            Last updated: February 2026
          </div>
        </div>
      </div>
    </div>
  );
}
