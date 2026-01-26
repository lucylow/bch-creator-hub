import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Link2, Copy, ExternalLink, Trash2, QrCode, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBCH } from '@/utils/formatters';
import { QRCodeModal } from '@/components/Common/QRCodeDisplay';
import EmptyState from '@/components/Common/EmptyState';
import Breadcrumbs from '@/components/Common/Breadcrumbs';

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
  { id: '1', title: 'Twitter Tips', description: 'Support my content on Twitter', amountSats: 0, type: 'tip', url: 'https://pay.bch/creator1/tip', clicks: 245, conversions: 42, createdAt: '2025-01-15' },
  { id: '2', title: 'Premium Article', description: 'Unlock exclusive content', amountSats: 50000, type: 'unlock', url: 'https://pay.bch/creator1/article-1', clicks: 89, conversions: 23, createdAt: '2025-01-10' },
  { id: '3', title: 'Monthly Membership', description: 'Get monthly access to all content', amountSats: 500000, type: 'subscription', url: 'https://pay.bch/creator1/membership', clicks: 156, conversions: 18, createdAt: '2025-01-05' },
  { id: '4', title: 'YouTube Superchat', description: 'Support during livestreams', amountSats: 0, type: 'tip', url: 'https://pay.bch/creator1/superchat', clicks: 312, conversions: 67, createdAt: '2025-01-12' },
  { id: '5', title: 'Premium Video Tutorial', description: 'Learn advanced BCH development', amountSats: 100000, type: 'unlock', url: 'https://pay.bch/creator1/tutorial-1', clicks: 134, conversions: 31, createdAt: '2025-01-08' },
  { id: '6', title: 'Annual Pass', description: 'Year-long access to all premium content', amountSats: 5000000, type: 'subscription', url: 'https://pay.bch/creator1/annual', clicks: 78, conversions: 12, createdAt: '2025-01-03' },
  { id: '7', title: 'Direct Donation', description: 'Support my work directly', amountSats: 0, type: 'tip', url: 'https://pay.bch/creator1/donate', clicks: 198, conversions: 54, createdAt: '2025-01-18' },
  { id: '8', title: 'Exclusive Newsletter', description: 'Weekly deep-dive on BCH ecosystem', amountSats: 25000, type: 'subscription', url: 'https://pay.bch/creator1/newsletter', clicks: 167, conversions: 28, createdAt: '2025-01-06' },
  { id: '9', title: 'Research Paper Access', description: 'Unlock detailed analysis documents', amountSats: 75000, type: 'unlock', url: 'https://pay.bch/creator1/research-1', clicks: 92, conversions: 19, createdAt: '2025-01-09' },
  { id: '10', title: 'Code Repository Access', description: 'Get access to private code repos', amountSats: 200000, type: 'subscription', url: 'https://pay.bch/creator1/code-access', clicks: 145, conversions: 26, createdAt: '2025-01-11' },
  { id: '11', title: 'One-on-One Consultation', description: 'Book a 30-minute session with me', amountSats: 500000, type: 'unlock', url: 'https://pay.bch/creator1/consultation', clicks: 43, conversions: 8, createdAt: '2025-01-14' },
  { id: '12', title: 'Podcast Premium Feed', description: 'Ad-free episodes with bonus content', amountSats: 150000, type: 'subscription', url: 'https://pay.bch/creator1/podcast', clicks: 221, conversions: 35, createdAt: '2025-01-07' },
  { id: '13', title: 'Workshop Recording', description: 'Full recording of the latest BCH workshop', amountSats: 150000, type: 'unlock', url: 'https://pay.bch/creator1/workshop', clicks: 203, conversions: 41, createdAt: '2025-01-16' },
  { id: '14', title: 'Discord VIP', description: 'VIP role and private channels access', amountSats: 100000, type: 'subscription', url: 'https://pay.bch/creator1/discord-vip', clicks: 178, conversions: 33, createdAt: '2025-01-13' },
  { id: '15', title: 'Livestream Highlight Reel', description: 'Download the best moments from last month', amountSats: 35000, type: 'unlock', url: 'https://pay.bch/creator1/highlights', clicks: 94, conversions: 21, createdAt: '2025-01-19' },
  { id: '16', title: 'Early Access Drops', description: 'Early access to new content and drops', amountSats: 0, type: 'tip', url: 'https://pay.bch/creator1/early', clicks: 267, conversions: 58, createdAt: '2025-01-20' },
  { id: '17', title: 'BCH Dev Office Hours', description: 'Reserve a slot for 1:1 dev help', amountSats: 300000, type: 'unlock', url: 'https://pay.bch/creator1/office-hours', clicks: 56, conversions: 11, createdAt: '2025-01-04' },
  { id: '18', title: 'Quarterly Report', description: 'In-depth ecosystem report (PDF + data)', amountSats: 125000, type: 'unlock', url: 'https://pay.bch/creator1/report-q1', clicks: 112, conversions: 27, createdAt: '2025-01-02' },
];

const typeColors = {
  tip: 'bg-primary/10 text-primary',
  unlock: 'bg-secondary/10 text-secondary',
  subscription: 'bg-blue-500/10 text-blue-400',
};

const PaymentLinksPage = () => {
  const [links] = useState<PaymentLink[]>(mockLinks);
  const [search, setSearch] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);

  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const showQRCode = (link: PaymentLink) => {
    setSelectedLink(link);
    setQrModalOpen(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Payment Links</h1>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => showQRCode(link)}
                  >
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
          <EmptyState
            icon={Link2}
            title={search ? "No links found" : "No payment links yet"}
            description={search 
              ? `No payment links match "${search}". Try a different search term.`
              : "Create your first payment link to start receiving BCH payments from your supporters."
            }
            action={{
              label: search ? "Clear Search" : "Create Your First Link",
              onClick: search ? () => setSearch('') : () => {},
              variant: search ? 'outline' : 'default',
            }}
            size="md"
          />
        )}
      </div>

      {selectedLink && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          value={selectedLink.url}
          title={selectedLink.title}
          description={selectedLink.description}
          size={256}
          level="M"
        />
      )}
    </div>
  );
};

export default PaymentLinksPage;
