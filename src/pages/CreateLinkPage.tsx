import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, DollarSign, Tag, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CreateLinkPage = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'tip',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setIsCreating(true);
    
    setTimeout(() => {
      setIsCreating(false);
      toast.success('Payment link created!');
      navigate('/links');
    }, 1500);
  };

  const types = [
    { id: 'tip', label: 'Tip', description: 'Accept any amount as tips' },
    { id: 'unlock', label: 'Content Unlock', description: 'Paywall for specific content' },
    { id: 'subscription', label: 'Subscription', description: 'Recurring access pass' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/links')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Payment Link</h1>
            <p className="text-muted-foreground">
              Set up a new way to receive BCH payments
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Link Type */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Payment Type
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-4 rounded-xl text-left transition-all ${
                      formData.type === type.id
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-muted/50 border-2 border-transparent hover:border-border'
                    }`}
                  >
                    <p className="font-semibold mb-1">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Link Details */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Link Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Support my content"
                    className="bg-muted/50 border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what supporters get..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Amount
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fixed Amount (BCH) - Leave empty for any amount
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.001"
                  min="0"
                  className="bg-muted/50 border-border"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supporters can pay any amount if left empty
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/links')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2"
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Link'}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CreateLinkPage;
