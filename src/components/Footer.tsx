import { Route, Twitter, Github } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
    { label: 'API Documentation', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Compliance', href: '#' },
  ],
};

const Footer = () => {
  return (
    <footer className="relative py-20 px-6 bg-card border-t border-border/50">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden="true" />
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 font-heading text-xl font-semibold mb-4 text-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg w-fit"
              aria-label="BCH Paywall Router – Home"
            >
              <Route className="w-6 h-6 text-primary flex-shrink-0" />
              BCH Paywall Router
            </Link>
            <p className="text-muted-foreground mb-6">
              Building the financial infrastructure for the decentralized creator economy. Powered by Bitcoin Cash.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Github, href: '#', label: 'GitHub' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
              <ThemeToggle variant="outline" size="sm" className="rounded-full w-10 h-10 p-0" />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary hover:pl-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:rounded rounded">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 id="footer-company" className="font-heading font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-3" aria-labelledby="footer-company">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary hover:pl-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 id="footer-legal" className="font-heading font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-3" aria-labelledby="footer-legal">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary hover:pl-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded inline-block">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground">
            © 2026 BCH Paywall Router. Part of the BCH-1 Hackcelerator. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Bitcoin Cash is changing how value moves on the internet. Join us.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
