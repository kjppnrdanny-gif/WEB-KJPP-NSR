import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FAQItemProps {
  question: string;
  answer: string;
}

export interface FAQProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  categories: Record<string, string>;
  faqData: Record<string, FAQItemProps[]>;
  className?: string;
}

// Main reusable FAQ component
export const FAQ: React.FC<FAQProps> = ({ 
  title = "FAQs",
  subtitle = "Frequently Asked Questions",
  categories,
  faqData,
  className,
  ...props 
}) => {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0]);

  return (
    <section 
      className={cn(
        "relative overflow-hidden bg-background px-4 py-12 text-foreground",
        className
      )}
      {...props}
    >
      <FAQHeader title={title} subtitle={subtitle} />
      <FAQTabs 
        categories={categories}
        selected={selectedCategory} 
        setSelected={setSelectedCategory} 
      />
      <FAQList 
        faqData={faqData}
        selected={selectedCategory} 
      />
    </section>
  );
};

const FAQHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="relative z-10 flex flex-col items-center justify-center">
    <span className="mb-4 bg-gradient-to-r from-sky-400 to-amber-300 bg-clip-text font-medium text-transparent text-sm tracking-wider uppercase">
      {subtitle}
    </span>
    <h2 className="mb-8 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center">{title}</h2>
    <span className="absolute -top-[350px] left-[50%] z-0 h-[500px] w-[600px] -translate-x-[50%] rounded-full bg-gradient-to-r from-sky-500/10 to-amber-500/5 blur-3xl pointer-events-none" />
  </div>
);

const FAQTabs = ({ 
  categories, 
  selected, 
  setSelected 
}: { 
  categories: Record<string, string>; 
  selected: string; 
  setSelected: (key: string) => void; 
}) => (
  <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
    {Object.entries(categories).map(([key, label]) => (
      <button
        key={key}
        onClick={() => setSelected(key)}
        className={cn(
          "relative overflow-hidden whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-300 cursor-pointer",
          selected === key
            ? "border-sky-400 text-slate-950 font-semibold"
            : "border-slate-700/80 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-600"
        )}
      >
        <span className="relative z-10">{label}</span>
        <AnimatePresence>
          {selected === key && (
            <motion.span
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 z-0 bg-gradient-to-r from-amber-400 to-yellow-500"
            />
          )}
        </AnimatePresence>
      </button>
    ))}
  </div>
);

const FAQList = ({ 
  faqData, 
  selected 
}: { 
  faqData: Record<string, FAQItemProps[]>; 
  selected: string; 
}) => (
  <div className="mx-auto mt-10 max-w-3xl">
    <AnimatePresence mode="wait">
      {Object.entries(faqData).map(([category, questions]) => {
        if (selected === category) {
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-3.5"
            >
              {questions.map((faq, index) => (
                <FAQItem key={index} {...faq} />
              ))}
            </motion.div>
          );
        }
        return null;
      })}
    </AnimatePresence>
  </div>
);

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden",
        isOpen ? "bg-slate-900/90 border-sky-500/40 shadow-lg" : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer group"
      >
        <span
          className={cn(
            "text-sm sm:text-base font-medium transition-colors",
            isOpen ? "text-amber-300 font-semibold" : "text-slate-200 group-hover:text-white"
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{
            open: { rotate: "45deg" },
            closed: { rotate: "0deg" },
          }}
          transition={{ duration: 0.2 }}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/80 border border-slate-700/80 text-sky-400 group-hover:border-sky-500/50"
        >
          <Plus className="h-4 w-4" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ 
          height: isOpen ? "auto" : "0px", 
          marginBottom: isOpen ? "16px" : "0px" 
        }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="overflow-hidden px-4 sm:px-5"
      >
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default FAQ;
