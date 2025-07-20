'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Feedback() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg !p-4 h-auto"
          onClick={() => setIsOpen(true)}
          aria-label="Open feedback form"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-neutral/95 backdrop-blur-sm rounded-[var(--border-radius-apple)] w-full max-w-2xl h-[90vh] max-h-[700px] shadow-xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 p-4 border-b border-neutral-dark/30 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Provide Feedback</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close feedback form"
                  >
                    <X className="w-5 h-5" />
                  </Button>
              </div>
              <div className="flex-grow bg-white">
                  <iframe
                    title="Feedback Form"
                    width="100%"
                    height="100%"
                    src="https://forms.office.com/r/b11P59ad8b?embed=true"
                    frameBorder="0"
                    marginWidth={0}
                    marginHeight={0}
                    style={{ border: 'none', display: 'block' }}
                    allowFullScreen
                  ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}