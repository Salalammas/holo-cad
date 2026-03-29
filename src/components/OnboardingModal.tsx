import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface OnboardingModalProps {
  onStart: () => void;
}

const STORAGE_KEY = 'holo-cad-skip-onboarding';

export default function OnboardingModal({ onStart }: OnboardingModalProps) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      onStart();
      return;
    }
    // Delay to trigger animation
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setAnimateIn(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onStart]);

  const handleStart = () => {
    if (dontShow) localStorage.setItem(STORAGE_KEY, 'true');
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      onStart();
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-[90vw] max-w-2xl border border-primary/60 rounded-lg p-8 transition-all duration-700 ${
          animateIn
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-95 translate-y-4 opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(135deg, hsla(220,20%,5%,0.85), hsla(220,20%,2%,0.92))',
          backdropFilter: 'blur(20px)',
          boxShadow:
            '0 0 30px hsla(180,100%,50%,0.15), inset 0 0 60px hsla(180,100%,50%,0.03)',
        }}
      >
        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-lg overflow-hidden opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(180,100%,50%,0.3) 2px, hsla(180,100%,50%,0.3) 4px)',
          }}
        />

        {/* Glitch bar animation */}
        <div
          className="pointer-events-none absolute inset-0 rounded-lg overflow-hidden"
          style={{ animation: 'glitch-scan 4s linear infinite' }}
        >
          <div
            className="absolute w-full h-[2px] bg-primary/20"
            style={{ top: '30%' }}
          />
        </div>

        {/* Corner accents */}
        <svg className="absolute top-0 left-0 w-8 h-8 text-primary/50" viewBox="0 0 32 32">
          <path d="M0 10 L0 0 L10 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-0 right-0 w-8 h-8 text-primary/50" viewBox="0 0 32 32">
          <path d="M22 0 L32 0 L32 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-8 h-8 text-primary/50" viewBox="0 0 32 32">
          <path d="M0 22 L0 32 L10 32" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-8 h-8 text-primary/50" viewBox="0 0 32 32">
          <path d="M22 32 L32 32 L32 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Title */}
        <h2
          className="font-display text-primary text-xl tracking-[0.3em] uppercase text-center mb-8"
          style={{
            textShadow: '0 0 10px hsla(180,100%,50%,0.5), 0 0 30px hsla(180,100%,50%,0.2)',
          }}
        >
          ◈ Quick Start Guide
        </h2>

        {/* 3 Pillars */}
        <div className="space-y-6 relative z-10">
          {/* Section 1 */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 rounded border border-primary/30 flex items-center justify-center text-primary/70 bg-primary/5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M4 10 L1 10 M24 10 L27 10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <path d="M2 10 L6 10" stroke="currentColor" strokeWidth="1.5">
                  <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                </path>
                <path d="M22 10 L26 10" stroke="currentColor" strokeWidth="1.5">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                </path>
              </svg>
            </div>
            <div>
              <h3 className="font-display text-primary text-sm tracking-[0.2em] uppercase mb-1">
                The Parallax View
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Move your head left or right to shift the hologram's perspective.
                The model tracks your position for a true 3D parallax effect.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 rounded border border-primary/30 flex items-center justify-center text-primary/70 bg-primary/5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="8" cy="14" r="3" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="20" cy="14" r="3" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 14 L1 14 M11 14 L17 14 M23 14 L27 14" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
                <path d="M8 10 L8 8 M20 10 L20 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <g>
                  <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                  <path d="M4 14 L1 14" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M24 14 L27 14" stroke="currentColor" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
            <div>
              <h3 className="font-display text-primary text-sm tracking-[0.2em] uppercase mb-1">
                Spatial Manipulation
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Pinch with both hands and pull apart to scale the model up.
                Push together to shrink it. A double-pinch gesture controls the hologram's size.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 rounded border border-primary/30 flex items-center justify-center text-primary/70 bg-primary/5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="10" y="6" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M14 18 L14 22 M10 22 L18 22" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 12 A8 8 0 0 0 22 12" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
                <g>
                  <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                  <circle cx="14" cy="12" r="1.5" fill="currentColor" />
                </g>
              </svg>
            </div>
            <div>
              <h3 className="font-display text-primary text-sm tracking-[0.2em] uppercase mb-1">
                Astra Voice AI
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Press the Mic button to speak to Astra. Try commands like
                "make it red", "rotate 45 degrees", or "reset view".
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-4 relative z-10">
          <button
            onClick={handleStart}
            className="group relative px-8 py-3 border border-primary/60 rounded font-display text-sm tracking-[0.2em] uppercase text-primary hover:bg-primary/10 transition-all duration-300"
            style={{
              boxShadow: '0 0 15px hsla(180,100%,50%,0.1)',
            }}
          >
            <span className="relative z-10">▶ Initialize System</span>
            <div className="absolute inset-0 rounded bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={dontShow}
              onCheckedChange={(v) => setDontShow(v === true)}
              className="border-primary/40 data-[state=checked]:bg-primary/20 data-[state=checked]:border-primary"
            />
            <span className="text-muted-foreground text-xs">
              Don't show this again
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
