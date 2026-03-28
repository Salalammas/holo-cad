import { Mic } from 'lucide-react';

interface MicButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  cooldown: number; // 0 = ready, 0-1 = cooling down
  lastResponse: string;
  onToggle: () => void;
}

export default function MicButton({
  isListening,
  isSpeaking,
  cooldown,
  lastResponse,
  onToggle,
}: MicButtonProps) {
  const isCoolingDown = cooldown > 0 && cooldown < 1;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - cooldown);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
      {/* Astra response bubble */}
      {lastResponse && (
        <div className="bg-background/80 border border-primary/30 rounded px-3 py-1.5 text-xs font-mono text-primary max-w-[280px] text-center backdrop-blur-sm">
          <span className="text-muted-foreground mr-1">ASTRA:</span>
          {lastResponse}
        </div>
      )}

      {/* Mic button with cooldown ring */}
      <button
        onClick={onToggle}
        disabled={isCoolingDown}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
          isListening
            ? 'bg-red-500/80 shadow-[0_0_20px_rgba(255,0,0,0.5)]'
            : isCoolingDown
            ? 'bg-muted/50 cursor-not-allowed'
            : 'bg-primary/20 hover:bg-primary/30 shadow-[var(--cyan-glow)]'
        } border ${
          isListening ? 'border-red-400' : 'border-primary/40'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {/* Cooldown ring */}
        {isCoolingDown && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100"
            />
          </svg>
        )}
        <Mic
          className={`w-6 h-6 ${
            isListening ? 'text-white animate-pulse' : 'text-primary'
          }`}
        />
      </button>

      {/* Status label */}
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        {isListening
          ? 'Listening…'
          : isSpeaking
          ? 'Speaking…'
          : isCoolingDown
          ? `${Math.ceil(12 * (1 - cooldown))}s`
          : 'Voice'}
      </span>
    </div>
  );
}
