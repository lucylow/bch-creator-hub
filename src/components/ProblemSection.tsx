import { motion } from 'framer-motion';
import { DollarSign, Percent, Clock } from 'lucide-react';

const problems = [
  {
    icon: DollarSign,
    title: 'Revenue Fragmentation',
    description: 'Earnings scattered across Patreon, YouTube, Ko-fi, PayPal, and more. No single view of your income.',
  },
  {
    icon: Percent,
    title: 'Hidden Fees Everywhere',
    description: 'Platforms take 5-12% + payment processor fees. Your $1 tip becomes $0.85 after everyone takes their cut.',
  },
  {
    icon: Clock,
    title: 'Operational Overhead',
    description: 'Hours wasted each month reconciling payments, managing subscriptions, and handling platform-specific rules.',
  },
];

const ProblemSection = () => {
  return (
    <section id="problem" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">The Creator Payment Crisis</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Content creators lose hours and hundreds of dollars every month managing fragmented payment systems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-6 border-l-4 border-destructive"
            >
              <problem.icon className="w-10 h-10 text-destructive mb-4" />
              <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
