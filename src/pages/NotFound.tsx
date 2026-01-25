import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, MapPinOff } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.warn("404 Error: User attempted to access non-existent route", { pathname: location.pathname });
  }, [location.pathname]);

  const canGoBack = window.history.length > 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center max-w-md w-full"
      >
        <div className="glass-card rounded-2xl p-8 sm:p-10 border-border/50 shadow-lg">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6"
          >
            <MapPinOff className="w-8 h-8 text-muted-foreground" />
          </motion.div>
          <p className="font-heading text-6xl sm:text-7xl font-bold text-gradient mb-2">404</p>
          <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canGoBack && (
              <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
                Go back
              </Button>
            )}
            <Link to="/">
              <Button className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
