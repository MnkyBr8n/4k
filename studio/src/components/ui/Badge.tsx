import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5
        text-xs font-medium
        rounded-sm
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Icon badge (for gallery items)
interface IconBadgeProps {
  icon: string;
  title?: string;
  className?: string;
}

export function IconBadge({ icon, title, className = '' }: IconBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        w-6 h-6
        text-sm
        bg-black/50 backdrop-blur-sm
        rounded
        ${className}
      `}
      title={title}
    >
      {icon}
    </span>
  );
}

// Tag component (for image tags)
interface TagProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className = '' }: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5
        text-xs
        bg-gray-100 text-gray-700
        dark:bg-dark-tertiary dark:text-gray-300
        rounded
        ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ×
        </button>
      )}
    </span>
  );
}
