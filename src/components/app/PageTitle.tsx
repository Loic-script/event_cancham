import type { ReactNode } from "react";

type PageTitleProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  mobileHidden?: boolean;
};

export function PageTitle({ title, subtitle, actions, mobileHidden = true }: PageTitleProps) {
  return (
    <div className={`${mobileHidden ? "hidden lg:flex" : "flex"} mb-6 items-end justify-between gap-4`}>
      <div>
        <span aria-hidden className="mb-3 block h-1 w-10 rounded-full bg-[linear-gradient(90deg,#f26b1d,#12305a)]" />
        <h1 className="font-display text-[2rem] leading-none tracking-tight text-graphite lg:text-[2.4rem]">{title}</h1>
        {subtitle ? <p className="mt-2 text-[15px] text-graphite-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
