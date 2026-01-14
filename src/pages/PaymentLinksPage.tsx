import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Link2, Copy, ExternalLink, Trash2, QrCode, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBCH } from '@/utils/formatters';

interface PaymentLink {
  id: string;
  title: string;
  description: string;
  amountSats: number;
  type: 'tip' | 'unlock' | 'subscription';
  url: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

const mockLinks: PaymentLink[] = [
  { id: '1', title: 'Twitter Tips', description: 'Support my content on Twitter', amountSats: 0, type: 'tip', url: 'https://pay.bch/creator1/tip', clicks: 245, conversions: 42, createdAt: '2024-01-15' },
  { id: '2', title: 'Premium Article', description: 'Unlock exclusive content', amountSats: 50000, type: 'unlock', url: 'https://pay.bch/creator1/article-1', clicks: 89, conversions: 23, createdAt: '2024-01-10' },
  { id: '3', title: 'Monthly Membership', description: 'Get monthly access to all content', amountSats: 500000, type: 'subscription', url: 'https://pay.bch/creator1/membership', clicks: 156, conversions: 18, createdAt: '2024-01-05' },
];

const typeColors = {
  tip: 'bg-primary/10 text-primary',
  unlock: 'bg-secondary/10 text-secondary',
  subscription: 'bg-blue-500/10 text-blue-400',
};

const PaymentLinksPage = () => {
  const [links] = useState<PaymentLink[]>(mockLinks);
  const [search, setSearch] = useState('');

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Links</h1>
            <p className="text-muted-foreground">
              Create and manage your payment links
            </p>
          </div>
          
          <Link to="/links/new">
            <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Create New Link
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm bg-muted/50 border-border"
          />
        </div>

        {/* Links Grid */}
        <div className="grid gap-4">
          {filteredLinks.map((link, index) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{link.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[link.type]}`}>
                        {link.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{link.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{link.amountSats > 0 ? formatBCH(link.amountSats) : 'Any amount'}</span>
                      <span>•</span>
                      <span>{link.clicks} clicks</span>
                      <span>•</span>
                      <span>{link.conversions} conversions</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(link.url)}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    QR
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredLinks.length === 0 && (
          <div className="text-center py-16">
            <Link2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No payment links yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first payment link to start receiving BCH
            </p>
            <Link to="/links/new">
              <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
                Create Your First Link
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentLinksPage;
