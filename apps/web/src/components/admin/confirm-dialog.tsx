'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: 'Confirm',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
  });

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions({
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        variant: opts.variant ?? 'default',
      });
      setOpen(true);
      (window as unknown as { __confirmResolve?: (v: boolean) => void }).__confirmResolve = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    (window as unknown as { __confirmResolve?: (v: boolean) => void }).__confirmResolve?.(true);
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    (window as unknown as { __confirmResolve?: (v: boolean) => void }).__confirmResolve?.(false);
    setOpen(false);
  }, []);

  const dialog = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  options.variant === 'danger'
                    ? 'bg-red-100'
                    : options.variant === 'warning'
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                }`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${
                    options.variant === 'danger'
                      ? 'text-red-600'
                      : options.variant === 'warning'
                        ? 'text-amber-600'
                        : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{options.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{options.message}</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {options.cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                      options.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700'
                        : options.variant === 'warning'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-gold-500 hover:bg-gold-600'
                    }`}
                  >
                    {options.confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return { confirm, dialog };
}
