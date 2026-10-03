import { Icon } from "./Icon";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface ErrorStateProps {
  title?: string;
  message?: string;
  offline?: boolean;
  notFound?: boolean;
  onRetry?: () => void;
}

export function ErrorState({ title, message, offline, notFound, onRetry }: ErrorStateProps): JSX.Element {
  if (notFound) {
    return <EmptyState icon="search_off" title="Not found" text={message ?? "The item you requested could not be located."} />;
  }
  return (
    <div className="p-10 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/60">
      <div className="w-16 h-16 mx-auto rounded-full bg-error-container flex items-center justify-center text-error">
        <Icon name={offline ? "cloud_off" : "error"} className="text-[30px]" />
      </div>
      <h3 className="text-headline-sm font-headline-sm font-bold text-primary mt-4">{title ?? "Something went wrong"}</h3>
      <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">{message ?? "Please try again."}</p>
      {offline ? <p className="text-label-sm font-label-sm text-outline mt-1">You can browse cached content while offline.</p> : null}
      {onRetry ? (
        <div className="mt-5">
          <Button icon="refresh" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
