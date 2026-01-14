import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  QrCode, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const InteractiveDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps: DemoStep[] = [
    {
      id: 0,
      title: 'Scan QR Code',
      description: 'Creator shares their payment QR code',
      icon: QrCode,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 bg-white p-4 rounded-lg shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-foreground/20" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            bitcoincash:qpaq9sh8w7...
          </p>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Connect Wallet',
      description: 'Supporter connects their BCH wallet',
      icon: Wallet,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-xl p-6 max-w-xs w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Electron Cash</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-sm font-semibold">0.25 BCH</span>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Wallet connected successfully</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Enter Amount',
      description: 'Enter the payment amount',
      icon: Send,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full"
            >
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Payment Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value="0.01 BCH"
                    readOnly
                    className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 text-lg font-semibold text-center"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  ≈ $4.20 USD
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="text-foreground">~$0.002</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">0.01 BCH</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Confirm Payment',
      description: 'Review and confirm the transaction',
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-1">Confirm Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Send 0.01 BCH to creator
                </p>
              </div>
              <div className="space-y-3 py-3 border-y border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono text-xs">qpaq9sh8w7...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">0.01 BCH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee</span>
                  <span>~$0.002</span>
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Confirm & Send
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Processing',
      description: 'Transaction is being processed on the blockchain',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Zap className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="font-semibold text-lg mb-2">Processing...</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Broadcasting transaction to Bitcoin Cash network
              </p>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Usually confirms in &lt;1 second</span>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Payment Complete',
      description: 'Transaction confirmed! Creator receives payment instantly',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-semibold text-xl mb-2 text-primary"
              >
                Payment Complete!
              </motion.h3>
              <p className="text-sm text-muted-foreground mb-4">
                Transaction confirmed on Bitcoin Cash network
              </p>
              <div className="bg-background/50 rounded-lg p-4 space-y-2 text-left mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TXID</span>
                  <span className="font-mono text-xs">a1b2c3d4...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">0.01 BCH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Confirmed
                  </span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                delayChildren={0.2}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Creator received payment instantly
              </motion.div>
            </motion.div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }
      setCurrentStep(step);
    }, 3000);
  };

  const currentStepData = steps[currentStep];

  return (
    <section id="demo" className="py-24 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Experience the seamless payment flow in under 5 seconds
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Indicator */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-border/50 h-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Payment Flow</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlay}
                      disabled={isPlaying}
                    >
                      {isPlaying ? 'Playing...' : 'Auto Play'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;

                      return (
                        <motion.div
                          key={step.id}
                          onClick={() => !isPlaying && setCurrentStep(index)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            isActive
                              ? 'bg-primary/20 border border-primary'
                              : isCompleted
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-background/50 border border-transparent hover:border-border'
                          }`}
                          whileHover={!isPlaying ? { scale: 1.02 } : {}}
                          whileTap={!isPlaying ? { scale: 0.98 } : {}}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : isCompleted
                                ? 'bg-primary/30 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {step.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {step.description}
                            </p>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-border/50 h-full min-h-[500px]">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <currentStepData.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Step {currentStep + 1} of {steps.length}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      {currentStepData.content}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === 0 || isPlaying}
                      >
                        Previous
                      </Button>
                      <div className="flex gap-2">
                        {steps.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentStep
                                ? 'bg-primary w-8'
                                : 'bg-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        onClick={handleNext}
                        disabled={isPlaying}
                        className="bg-gradient-primary hover:opacity-90"
                      >
                        {currentStep === steps.length - 1 ? 'Restart' : 'Next'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;

