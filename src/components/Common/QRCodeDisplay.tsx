import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Copy, Share2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  showDownload?: boolean;
  showCopy?: boolean;
  showShare?: boolean;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  title = 'Scan QR Code',
  description,
  size = 256,
  level = 'H',
  showDownload = true,
  showCopy = true,
  showShare = true,
  className = '',
  bgColor = '#FFFFFF',
  fgColor = '#000000'
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const downloadQRCode = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        toast.error('QR code not found');
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const padding = 20;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Failed to create canvas');
        return;
      }

      // Fill background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, padding, padding, size, size);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }
          
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `qrcode-${Date.now()}.png`;
          link.href = downloadUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          toast.success('QR code downloaded');
        }, 'image/png');
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast.error('Failed to generate QR code image');
      };
      
      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || value,
          url: value
        });
        toast.success('Shared successfully');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback to copying
      copyToClipboard();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="p-4 bg-white rounded-xl mb-4" ref={qrRef}>
        <QRCode
          value={value}
          size={size}
          level={level}
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </div>
      
      {(title || description) && (
        <div className="text-center mb-4">
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {(showDownload || showCopy || showShare) && (
        <div className="flex gap-2 flex-wrap justify-center">
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQRCode}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
          {showCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          )}
          {showShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={shareQRCode}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface QRCodeModalProps extends QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onOpenChange,
  value,
  title = 'Scan QR Code',
  description = 'Use any BCH wallet to scan this code',
  size = 256,
  level = 'H',
  showDownload = true,
  showCopy = true,
  showShare = true,
  bgColor = '#FFFFFF',
  fgColor = '#000000'
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <QRCodeDisplay
          value={value}
          size={size}
          level={level}
          showDownload={showDownload}
          showCopy={showCopy}
          showShare={showShare}
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;

