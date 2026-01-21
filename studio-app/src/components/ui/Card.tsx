import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-dark-panel
        border border-gray-200 dark:border-dark-border
        rounded
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Card with header
interface CardWithHeaderProps extends CardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardWithHeader({
  title,
  subtitle,
  action,
  children,
  className = '',
}: CardWithHeaderProps) {
  return (
    <Card className={className} padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

// Stat card for dashboard
interface StatCardProps {
  icon?: string;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

export function StatCard({ icon, value, label, trend, className = '' }: StatCardProps) {
  return (
    <Card className={`${className}`}>
      <div className="flex items-start justify-between">
        {icon && <span className="text-2xl">{icon}</span>}
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.direction === 'up' ? 'text-success' : 'text-error'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      </div>
    </Card>
  );
}

// Quick action card
interface ActionCardProps {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ActionCard({ icon, label, onClick, href, className = '' }: ActionCardProps) {
  const content = (
    <>
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </>
  );

  const baseClasses = `
    flex flex-col items-center justify-center
    p-4 rounded-lg
    bg-gradient-to-br from-brand/80 to-brand-secondary/80
    text-white
    cursor-pointer
    transition-all duration-200
    hover:translate-y-[-2px] hover:shadow-lg hover:shadow-brand/30
    ${className}
  `;

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}
