import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, QrCode, Send, Settings, Share2, Wallet } from 'lucide-react';

const actions = [
  { icon: Link2, label: 'Create Link', href: '/links/new', color: 'bg-primary/10 text-primary' },
  { icon: QrCode, label: 'QR Code', href: '/links', color: 'bg-secondary/10 text-secondary' },
  { icon: Share2, label: 'Share Profile', href: '/settings', color: 'bg-blue-500/10 text-blue-400' },
  { icon: Send, label: 'Withdraw', href: '/settings', color: 'bg-emerald-500/10 text-emerald-400' },
];

const QuickActions = () => {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
