import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      {/* Glow Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,hsl(160_90%_40%/0.1)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl relative z-10"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            <span className="text-gradient">One Address. Every Platform. Infinite Freedom.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Stop managing 10+ payment links. Collect Bitcoin Cash tips, unlocks, and subscriptions 
            with a single address that works everywhere.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg glow-effect"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Start for Free
              </Button>
            </Link>

            <Button
              onClick={() => scrollToSection('#waitlist')}
              variant="outline"
              size="lg"
              className="border-border hover:border-primary hover:text-primary px-8 py-6 text-lg bg-transparent"
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Join Waitlist
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
