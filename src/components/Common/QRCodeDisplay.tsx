import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Copy, Share2, Check, FileImage, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Slugify a string for use in filenames */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 32) || 'qrcode';
}

export interface QRCodeDisplayProps {
  value: string;
  title?: string;
  description?: string;
  /** Short hint shown under the QR, e.g. "Point your BCH wallet at this code" */
  scanHint?: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  showDownload?: boolean;
  showCopy?: boolean;
  showShare?: boolean;
  /** Show "Copy image" to put QR as PNG in clipboard */
  showCopyImage?: boolean;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  /** Base filename for downloads (extension added automatically). Derived from title if not set. */
  downloadFilename?: string;
  /** Use theme-aware container (card/muted) while keeping QR high-contrast for scanning */
  themed?: boolean;
  /** Subtle pulse on the QR container to draw attention */
  animate?: boolean;
  /** When false, title/description are not rendered (e.g. when used inside a modal that shows them in the header) */
  showTitleDescription?: boolean;
}

const DEFAULT_SCAN_HINT = 'Point your BCH wallet at this code to pay';

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  title = 'Scan QR Code',
  description,
  scanHint = DEFAULT_SCAN_HINT,
  size = 256,
  level = 'H',
  showDownload = true,
  showCopy = true,
  showShare = true,
  showCopyImage = false,
  className = '',
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  downloadFilename,
  themed = true,
  animate = true,
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const baseName = downloadFilename ?? slugify(title);

  const getQRCanvas = (): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        resolve(null);
        return;
      }
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      const canvas = document.createElement('canvas');
      const padding = 20;
      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, padding, padding, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  const downloadPNG = async () => {
    try {
      const canvas = await getQRCanvas();
      if (!canvas) {
        toast.error('QR code not found');
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${baseName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('QR code downloaded as PNG');
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const downloadSVG = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        toast.error('QR code not found');
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${baseName}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded as SVG');
    } catch (error) {
      console.error('Error downloading SVG:', error);
      toast.error('Failed to download SVG');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Address or link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyImageToClipboard = async () => {
    try {
      const canvas = await getQRCanvas();
      if (!canvas) {
        toast.error('QR code not found');
        return;
      }
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        toast.success('QR image copied to clipboard');
        setTimeout(() => setCopiedImage(false), 2000);
      }, 'image/png');
    } catch (error) {
      console.error('Error copying QR image:', error);
      toast.error('Failed to copy image');
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        const canvas = await getQRCanvas();
        if (canvas) {
          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob((b) => res(b), 'image/png')
          );
          if (blob && navigator.canShare?.({ files: [new File([blob], `${baseName}.png`, { type: 'image/png' })] })) {
            await navigator.share({
              title,
              text: description || value,
              files: [new File([blob], `${baseName}.png`, { type: 'image/png' })],
            });
            toast.success('QR code shared');
            return;
          }
        }
        await navigator.share({
          title,
          text: description || value,
          url: value,
        });
        toast.success('Shared successfully');
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const containerClasses = themed
    ? 'rounded-xl border border-border bg-card p-4 shadow-sm'
    : 'rounded-xl bg-white p-4 border border-border';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative mb-4 ${containerClasses} ${animate ? 'animate-fade-in' : ''}`}
        ref={qrRef}
      >
        {animate && (
          <span
            className="absolute inset-0 rounded-xl animate-pulse pointer-events-none opacity-[0.03] bg-primary"
            aria-hidden
          />
        )}
        <div className="relative z-0">
          <QRCode
            value={value}
            size={size}
            level={level}
            bgColor={bgColor}
            fgColor={fgColor}
          />
        </div>
      </div>

      {scanHint && (
        <p className="text-xs text-muted-foreground text-center mb-3 max-w-[min(100%,280px)]">
          {scanHint}
        </p>
      )}

      {showTitleDescription && (title || description) && (
        <div className="text-center mb-4">
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {(showDownload || showCopy || showShare || showCopyImage) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {showDownload && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={downloadPNG} className="gap-2">
                  <FileImage className="w-4 h-4" />
                  PNG (best for screens)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadSVG} className="gap-2">
                  <FileCode className="w-4 h-4" />
                  SVG (best for print)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  Copy link
                </>
              )}
            </Button>
          )}
          {showCopyImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyImageToClipboard}
              className="gap-2"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4" />
                  Image copied
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4" />
                  Copy image
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

export interface QRCodeModalProps extends QRCodeDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onOpenChange,
  value,
  title = 'Scan QR Code',
  description = 'Use any BCH wallet to scan this code',
  scanHint = DEFAULT_SCAN_HINT,
  size = 256,
  level = 'H',
  showDownload = true,
  showCopy = true,
  showShare = true,
  showCopyImage = true,
  downloadFilename,
  bgColor = '#FFFFFF',
  fgColor = '#000000',
  themed = true,
  animate = true,
  ...rest
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <QRCodeDisplay
          value={value}
          title={title}
          description={description}
          scanHint={scanHint}
          size={size}
          level={level}
          showDownload={showDownload}
          showCopy={showCopy}
          showShare={showShare}
          showCopyImage={showCopyImage}
          downloadFilename={downloadFilename ?? slugify(title)}
          bgColor={bgColor}
          fgColor={fgColor}
          themed={themed}
          animate={animate}
          showTitleDescription={false}
          {...rest}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
