import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Book, MessageCircle, Mail, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'Connect your Bitcoin Cash wallet to get started. Once connected, you can create payment links, set up your profile, and start receiving payments from your supporters.',
    },
    {
      question: 'What are payment links?',
      answer: 'Payment links are unique URLs and QR codes that you can share with your supporters. When someone pays through your link, the funds go directly to your smart contract address.',
    },
    {
      question: 'How do withdrawals work?',
      answer: 'You can withdraw your earnings anytime directly to your wallet. Withdrawals are processed on-chain and typically take a few minutes to confirm. There is a maximum 1% service fee on withdrawals (configurable to 0%).',
    },
    {
      question: 'Are my funds safe?',
      answer: 'Yes! BCH Creator Hub is non-custodial, meaning we never hold your funds. All funds are stored in smart contracts on the Bitcoin Cash blockchain. Only you control your private keys.',
    },
    {
      question: 'What are CashToken subscriptions?',
      answer: 'CashTokens are NFT-based subscription passes. You can create tokens that grant access to premium content. Supporters hold these tokens in their wallets, and you can verify token ownership to unlock content.',
    },
    {
      question: 'How much do you charge?',
      answer: 'Our service fee is a maximum of 1% on withdrawals (configurable to 0%). There are no fees for receiving payments. Network fees on Bitcoin Cash are extremely low (less than $0.01 per transaction).',
    },
    {
      question: 'How do I create an NFT?',
      answer: 'Navigate to the NFTs page to create and manage your NFT collections. You can upload images, set metadata, and create collections to sell or give away to your supporters.',
    },
    {
      question: 'Can I integrate this into my website?',
      answer: 'Yes! We provide a RESTful API that you can use to integrate payment functionality into your own website or application. Check the documentation for API endpoints and examples.',
    },
    {
      question: 'What payment types are supported?',
      answer: 'We support tips, subscriptions, paywall payments, and direct donations. You can specify the payment type when creating payment links.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach out to us through the contact form, email, or join our community Discord. We typically respond within 24-48 hours.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const topics = [
    {
      title: 'Getting Started',
      icon: Book,
      description: 'Learn the basics of using BCH Creator Hub',
      links: [
        { text: 'Creating Your Account', href: '#' },
        { text: 'Connecting Your Wallet', href: '#' },
        { text: 'Your First Payment Link', href: '#' },
      ],
    },
    {
      title: 'Payment Links',
      icon: MessageCircle,
      description: 'Everything about creating and managing payment links',
      links: [
        { text: 'Creating Payment Links', href: '#' },
        { text: 'QR Codes & Sharing', href: '#' },
        { text: 'Payment Types', href: '#' },
      ],
    },
    {
      title: 'NFTs & Subscriptions',
      icon: HelpCircle,
      description: 'Create and manage NFTs and subscriptions',
      links: [
        { text: 'Creating NFTs', href: '#' },
        { text: 'CashToken Subscriptions', href: '#' },
        { text: 'Managing Collections', href: '#' },
      ],
    },
    {
      title: 'API & Integration',
      icon: ExternalLink,
      description: 'Integrate BCH Creator Hub into your application',
      links: [
        { text: 'API Documentation', href: '#' },
        { text: 'Webhooks', href: '#' },
        { text: 'SDK & Examples', href: '#' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Help & Documentation</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions and learn how to use BCH Creator Hub
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 border-border/50 mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </motion.div>

        {/* Topics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {topics.map((topic, index) => (
            <div
              key={topic.title}
              className="glass-card rounded-xl p-6 border-border/50 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <topic.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{topic.title}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{topic.description}</p>
              <ul className="space-y-2">
                {topic.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-primary hover:underline text-sm flex items-center gap-2"
                    >
                      <span>{link.text}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="glass-card rounded-xl border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-8 border-border/50 text-center"
        >
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Reach out to our support team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Join Discord
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpPage;



