"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  titleClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  titleClassName,
  contentClassName,
  containerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={containerClassName}>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left p-5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className={titleClassName}>{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, translateX: -100 }}
            animate={{ height: "auto", opacity: 1, translateX: 0 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={contentClassName}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { ExpandableSection };
