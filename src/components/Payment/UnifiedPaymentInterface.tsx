import React from 'react';
import { Copy, QrCode, Share2, Coins, Lock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QRCodeDisplay from '@/components/Common/QRCodeDisplay';
import { generateUnifiedPaymentURI } from '@/lib/web3/utils/bch';
import { truncateAddress } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export type UnifiedPaymentType = 'tip' | 'subscription' | 'paywall';

const PAYMENT_TYPE_CONFIG: Record<
  UnifiedPaymentType,
  { label: string; shortLabel: string; icon: React.ReactNode; message: string }
> = {
  tip: {
    label: 'Tip',
    shortLabel: 'Tip',
    icon: <Coins className="w-4 h-4" />,
    message: 'Tip',
  },
  subscription: {
    label: 'Subscription',
    shortLabel: 'Sub',
    icon: <CalendarCheck className="w-4 h-4" />,
    message: 'Subscription',
  },
  paywall: {
    label: 'Unlock content',
    shortLabel: 'Unlock',
    icon: <Lock className="w-4 h-4" />,
    message: 'Unlock',
  },
};

export interface UnifiedPaymentInterfaceProps {
  /** Single BCH address used for all payment types */
  address: string;
  /** Creator name for labels */
  creatorName?: string;
  /** Current amount in satoshis (optional; when set, QR includes amount) */
  amountSats?: number;
  /** Selected payment type */
  paymentType: UnifiedPaymentType;
  /** Called when user changes payment type */
  onPaymentTypeChange: (type: UnifiedPaymentType) => void;
  /** Full URL of this payment page (for "Copy payment link") */
  paymentLinkUrl?: string;
  /** QR size in pixels */
  qrSize?: number;
  /** Compact layout (e.g. for embedding) */
  compact?: boolean;
  className?: string;
}

/**
 * Single QR code and address for all payment types (tips, subscriptions, paywalls).
 * One destination; payment type is reflected in the URI message and in-app flow.
 */
const UnifiedPaymentInterface: React.FC<UnifiedPaymentInterfaceProps> = ({
  address,
  creatorName = 'Creator',
  amountSats,
  paymentType,
  onPaymentTypeChange,
  paymentLinkUrl,
  qrSize = 220,
  compact = false,
  className,
}) => {
  const normalizedAddr = address.replace(/^(bitcoincash:|bchtest:|bchreg:)/i, '');
  const fullAddress = address.includes(':') ? address : `bitcoincash:${normalizedAddr}`;
  const typeConfig = PAYMENT_TYPE_CONFIG[paymentType];
  const qrValue = generateUnifiedPaymentURI(fullAddress, {
    amountSats: amountSats ?? undefined,
    message: typeConfig.message,
    label: creatorName,
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(fullAddress);
    toast.success('Address copied');
  };

  const copyPaymentLink = () => {
    const url = paymentLinkUrl || window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied');
  };

  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6', className)}>
      {/* Payment type selector: same QR/address for all */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Payment type</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAYMENT_TYPE_CONFIG) as UnifiedPaymentType[]).map((type) => {
            const config = PAYMENT_TYPE_CONFIG[type];
            const active = paymentType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPaymentTypeChange(type)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                )}
                aria-pressed={active}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          One QR and address for tips, subscriptions, and paywalls. Choose how to label this payment.
        </p>
      </div>

      {/* Single QR + address block */}
      <div
        className={cn(
          'rounded-2xl border border-border bg-muted/30 overflow-hidden',
          compact ? 'p-4' : 'p-6'
        )}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <QrCode className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Scan to pay — any BCH wallet</span>
          </div>
          <QRCodeDisplay
            value={qrValue}
            title="Payment QR"
            description=""
            scanHint="Scan with any BCH wallet to pay"
            size={qrSize}
            level="H"
            showDownload={true}
            showCopy={false}
            showShare={false}
            showTitleDescription={false}
            themed={true}
            animate={true}
            showScanFrame={true}
            className="mb-3"
          />
          <p className="text-xs text-muted-foreground text-center mb-3 max-w-[min(100%,300px)]">
            Same code for tips, subscriptions, and unlocks. Amount can be added when you pay.
          </p>

          {/* Single address */}
          <div className="w-full">
            <p className="text-sm font-medium text-foreground mb-1.5">Receive at this address</p>
            <div className="flex gap-2 items-center">
              <code
                className="flex-1 text-xs font-mono bg-background/80 text-foreground px-3 py-2 rounded-lg truncate border border-border"
                title={fullAddress}
              >
                {truncateAddress(fullAddress, 10)}
              </code>
              <Button type="button" variant="outline" size="icon" onClick={copyAddress} title="Copy address">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {paymentLinkUrl !== undefined && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 gap-2 text-muted-foreground hover:text-foreground"
              onClick={copyPaymentLink}
            >
              <Share2 className="w-4 h-4" />
              Copy payment link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedPaymentInterface;
