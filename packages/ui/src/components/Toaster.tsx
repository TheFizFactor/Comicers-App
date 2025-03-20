'use client';

import { useToast } from '@comicers/ui/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@comicers/ui/components/Toast';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

type IconVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

const iconMap: Record<IconVariant, React.ElementType> = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = 'default', ...props }) {
        const Icon = iconMap[variant as IconVariant];
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3">
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
