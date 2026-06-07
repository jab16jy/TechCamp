import React from "react";
import { motion } from "framer-motion";

const PulseBlock = ({ className }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

const SkeletonCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="ac-metric-card">
          <div className="flex items-center gap-[0.35rem]">
            <PulseBlock className="w-5 h-5 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <PulseBlock className="h-2 w-12" />
              <PulseBlock className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default SkeletonCard;
