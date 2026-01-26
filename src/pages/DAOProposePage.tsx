import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Common/Breadcrumbs";
import { ProposeForm } from "@/components/DAO";

const DAOProposePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 mb-8"
        >
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 mb-4">
            <Link to="/dao">
              <ArrowLeft className="w-4 h-4" />
              Back to governance
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileEdit className="w-8 h-8 text-primary" />
            Create proposal
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit a new governance proposal for the community to vote on.
          </p>
        </motion.div>
        <ProposeForm />
      </div>
    </div>
  );
};

export default DAOProposePage;
