import React from 'react';

type Props = {
  size?: number;
  text?: string;
  fullScreen?: boolean;
};

const LoadingSpinner: React.FC<Props> = ({ size = 48, text = 'Loading...', fullScreen = false }) => {
  const wrapperClass = fullScreen ? 'min-h-screen flex items-center justify-center' : 'flex items-center';
  return (
    <div className={wrapperClass}>
      <div className="flex items-center space-x-4">
        <div
          className="rounded-full animate-spin border-4"
          style={{
            width: size,
            height: size,
            borderColor: 'rgba(255,255,255,0.08)',
            borderTopColor: 'hsl(var(--primary))',
            borderRadius: '50%',
          }}
        />
        {text && <div className="text-muted-foreground">{text}</div>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
