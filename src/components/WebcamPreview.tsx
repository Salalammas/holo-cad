import { forwardRef } from 'react';

interface WebcamPreviewProps {
  isTracking: boolean;
}

const WebcamPreview = forwardRef<HTMLVideoElement, WebcamPreviewProps>(
  ({ isTracking }, ref) => {
    return (
      <div className="absolute bottom-4 right-4 z-20 w-48 rounded border border-primary/30 overflow-hidden shadow-[var(--cyan-glow)]">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="w-full h-auto block transform scale-x-[-1]"
          style={{ opacity: 0.7 }}
        />
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-xs font-mono text-muted-foreground">
            Starting camera…
          </div>
        )}
      </div>
    );
  }
);

WebcamPreview.displayName = 'WebcamPreview';

export default WebcamPreview;
