import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

type TipButtonProps = {
  creatorId: string;
  amountSats?: number;
  contentId?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

/**
 * TipButton - Embeddable component for tipping creators
 * 
 * This component renders an embeddable button that generates OP_RETURN payment links
 * On click, it calls the API to build a pre-filled payment URL with payload then opens PaymentPage
 */
export default function TipButton({ 
  creatorId, 
  amountSats = 10000, 
  contentId, 
  style, 
  onClick 
}: TipButtonProps) {
  const handleClick = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/creator/${creatorId}/payment-link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include auth token if available
          ...(localStorage.getItem('token') && {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({ 
          paymentType: 1, // tip
          contentId, 
          amountSats 
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate payment link');
      }

      const { data } = await res.json();
      const { url } = data;
      
      // Open payment page (or trigger wallet via URI)
      window.open(url, '_blank', 'noopener');
      
      if (onClick) onClick();
    } catch (err) {
      console.error('Tip button error:', err);
      // Fallback: open generic payment page
      window.open(`/pay/${creatorId}`, '_blank', 'noopener');
    }
  };

  return (
    <Button
      onClick={handleClick}
      style={{
        background: 'linear-gradient(90deg, #0ac18e, #8c59ff)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        ...style
      }}
      className="bg-gradient-primary"
      aria-label="Tip Creator"
    >
      <Heart className="w-4 h-4 mr-2" />
      Tip
    </Button>
  );
}


