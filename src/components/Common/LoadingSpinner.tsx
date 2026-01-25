import React from 'react';

type Props = {
  size?: number;
  text?: string;
  fullScreen?: boolean;
};

const LoadingSpinner: React.FC<Props> = ({ size = 48, text = 'Loading...', fullScreen = false }) => {
  const wrapperClass = fullScreen
    ? 'min-h-screen flex flex-col items-center justify-center gap-4 pt-24 bg-background'
    : 'flex items-center gap-4';
  return (
    <div className={wrapperClass} role="status" aria-live="polite" aria-label={text}>
      <div
        className="rounded-full animate-spin border-[3px] border-muted border-t-primary"
        style={{ width: size, height: size }}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse" aria-hidden>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
