import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

type Props = { children: JSX.Element };

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isConnected, isLoading } = useWallet();

  if (isLoading) return null;

  if (!isConnected) {
    toast('Please connect your wallet to continue', { icon: '🔒' });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;



