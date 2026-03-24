import React from 'react';

interface DashboardModuleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <section className="card-modern overflow-hidden">
      <div className="p-6 border-b border-neutral-100 bg-neutral-50/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
};

