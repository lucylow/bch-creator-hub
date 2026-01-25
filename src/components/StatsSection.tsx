import { motion } from 'framer-motion';

const stats = [
  { value: '1%', label: 'Average Fee (vs 10%+ elsewhere)' },
  { value: '$0.002', label: 'Per Transaction Cost' },
  { value: '∞', label: 'Platforms Supported' },
  { value: '<1s', label: 'Payment Confirmation' },
];

const StatsSection = () => {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl p-6 text-center hover:border-primary transition-all duration-300 hover:-translate-y-1"
          >
            <div className="font-heading text-4xl font-bold text-gradient mb-2">{stat.value}</div>
            <p className="text-muted-foreground text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
