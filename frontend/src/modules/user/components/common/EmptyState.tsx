import { Icon } from "./Icon";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  text?: string;
  ctaLabel?: string;
  ctaRoute?: string;
}

export function EmptyState({ icon = "inbox", title, text, ctaLabel, ctaRoute }: EmptyStateProps): JSX.Element {
  return (
    <div className="p-10 md:p-14 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/60">
      <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center text-outline">
        <Icon name={icon} className="text-[30px]" />
      </div>
      <h3 className="text-headline-sm font-headline-sm font-bold text-primary mt-4">{title}</h3>
      {text ? <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">{text}</p> : null}
      {ctaLabel && ctaRoute ? (
        <div className="mt-5">
          <Button variant="accent" onClick={() => window.location.assign(ctaRoute)}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
