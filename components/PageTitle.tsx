import { type ReactNode } from 'react';
type PageTitleProps = {
  title: string;
  subtitle?: ReactNode;
  className?: string;
};

export function PageTitle({ title, subtitle, className }: PageTitleProps) {
  return (
    <header className={["text-center", className].filter(Boolean).join(" ")}> 
      <div>
        <div className="relative inline-block">
          <h1 className="text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <span className="pointer-events-none absolute -inset-x-2 -inset-y-1 -z-10 rounded-lg bg-gradient-to-r from-indigo-500/10 via-cyan-400/10 to-indigo-500/10 blur-sm"></span>
        </div>
        {subtitle && (
          <p className="mt-2 text-slate-300">{subtitle}</p>
        )}
      </div>
    </header>
  );
}


