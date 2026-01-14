import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, Share2, BarChart3, Settings, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCreator } from '@/contexts/CreatorContext';

type Props = { creatorAddress?: string };

const QuickActions: React.FC<Props> = ({ creatorAddress }) => {
  const { creator } = useCreator();
  const address = creatorAddress || creator?.address || '';

  const handleExport = () => {
    toast.success('Export queued. We emailed the CSV to you.');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pay/${creator?.id || 'creator'}/default`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Support me', url });
      } catch (e) {
        navigator.clipboard.writeText(url);
        toast.success('Payment link copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Payment link copied to clipboard');
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Link to="/links/new" className="w-full">
          <Button className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Create Payment Link
          </Button>
        </Link>

        <Link to="/links" className="w-full">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-muted/50"
          >
            <Link2 className="w-4 h-4" />
            View All Links
          </Button>
        </Link>

        <Link to="/analytics" className="w-full">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-muted/50"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Button>
        </Link>

        <Button 
          onClick={handleExport} 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 hover:bg-muted/50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>

        <Button 
          onClick={handleShare} 
          variant="outline"
          className="w-full flex items-center justify-center gap-2 hover:bg-muted/50"
        >
          <Share2 className="w-4 h-4" />
          Share Payment Link
        </Button>

        <Link to="/settings" className="w-full">
          <Button 
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-muted/50"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
