import { Button } from '@/components/ui/button';

interface HudOverlayProps {
  isTracking: boolean;
  ready: boolean;
  headX: number;
  headY: number;
  leftPinch: boolean;
  rightPinch: boolean;
  scale: number;
  onCalibrate: () => void;
}

export default function HudOverlay({
  isTracking,
  ready,
  headX,
  headY,
  leftPinch,
  rightPinch,
  scale,
  onCalibrate,
}: HudOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-primary text-lg tracking-[0.3em] uppercase drop-shadow-[var(--cyan-glow)]">
            Holo-CAD Viewer
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isTracking ? 'bg-primary shadow-[var(--cyan-glow)]' : 'bg-muted-foreground'
              }`}
            />
            <span className="text-muted-foreground">
              {!ready ? 'LOADING MODELS…' : isTracking ? 'TRACKING ACTIVE' : 'NO FACE DETECTED'}
            </span>
          </div>
        </div>
        <Button
          variant="hud"
          size="sm"
          className="pointer-events-auto"
          onClick={onCalibrate}
        >
          ◎ Calibrate
        </Button>
      </div>

      {/* Bottom telemetry */}
      <div className="absolute bottom-4 left-4 space-y-1 text-xs font-mono text-muted-foreground">
        <div>HEAD X: <span className="text-primary">{headX.toFixed(2)}</span></div>
        <div>HEAD Y: <span className="text-primary">{headY.toFixed(2)}</span></div>
        <div>SCALE: <span className="text-primary">{scale.toFixed(2)}</span></div>
        <div className="flex gap-3 mt-1">
          <span className={leftPinch ? 'text-primary' : ''}>L-PINCH: {leftPinch ? '●' : '○'}</span>
          <span className={rightPinch ? 'text-primary' : ''}>R-PINCH: {rightPinch ? '●' : '○'}</span>
        </div>
      </div>

      {/* Corner decorations */}
      <svg className="absolute top-0 left-0 w-16 h-16 text-primary/30" viewBox="0 0 64 64">
        <path d="M0 20 L0 0 L20 0" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute top-0 right-0 w-16 h-16 text-primary/30" viewBox="0 0 64 64">
        <path d="M44 0 L64 0 L64 20" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-16 h-16 text-primary/30" viewBox="0 0 64 64">
        <path d="M0 44 L0 64 L20 64" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-16 h-16 text-primary/30" viewBox="0 0 64 64">
        <path d="M44 64 L64 64 L64 44" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
