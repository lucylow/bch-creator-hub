import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Wallet, Bell, Shield, Palette, Save, Copy, ArrowLeft, Home, BarChart2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreator } from '@/contexts/CreatorContext';
import { useWallet } from '@/contexts/WalletContext';
import { truncateAddress, formatBCH } from '@/utils/formatters';
import Breadcrumbs from '@/components/Common/Breadcrumbs';

const SettingsPage = () => {
  const { creator, updateCreator } = useCreator();
  const { address, balance } = useWallet();
  const [displayName, setDisplayName] = useState(creator?.displayName || '');
  const [bio, setBio] = useState(creator?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateCreator({ displayName, bio });
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved!');
    }, 1000);
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
          
          {/* Quick Navigation Links */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart2 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
            <Link to="/links">
              <Button variant="outline" size="sm" className="gap-2">
                <Link2 className="w-4 h-4" />
                Payment Links
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell supporters about yourself"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Wallet Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Address</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono truncate">
                      {address}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAddress(address)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contract Address</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-muted/50 text-sm font-mono truncate">
                      {creator?.contractAddress || 'Not deployed'}
                    </code>
                    {creator?.contractAddress && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAddress(creator.contractAddress)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                    <p className="text-2xl font-bold text-primary">{formatBCH(balance.confirmed)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold">{formatBCH(balance.unconfirmed)}</p>
                  </div>
                </div>

                <Button className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground">
                  Withdraw to Wallet
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other tabs placeholder */}
        {(activeTab === 'notifications' || activeTab === 'security') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              {activeTab === 'notifications' ? 'Notification Settings' : 'Security Settings'}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === 'notifications' 
                ? 'Configure how you want to be notified about payments and updates.'
                : 'Manage your account security and access settings.'}
            </p>
            <p className="text-sm text-muted-foreground mt-4">Coming soon...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
