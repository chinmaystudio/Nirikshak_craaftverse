import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { ROUTES } from "@/constants/routes";
import { navigate } from "@/app/router";

export function NotFoundPage(): JSX.Element {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-5">
      <div className="w-24 h-24 mx-auto rounded-2xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-secondary shadow-sm">
        <Icon name="explore_off" className="text-[48px]" />
      </div>
      <div>
        <span className="text-label-sm uppercase tracking-widest font-bold text-secondary">
          Error 404
        </span>
        <h1 className="text-headline-lg font-extrabold text-primary mt-1">Page Not Found</h1>
        <p className="text-body-md text-on-surface-variant max-w-md mx-auto mt-2">
          The requested section does not exist on the NIRIKSHAK Public Infrastructure Portal, or the route has been updated.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
        <Button variant="accent" icon="home" onClick={() => navigate(ROUTES.HOME)}>
          Go to Home
        </Button>
        <Button variant="outline" icon="travel_explore" onClick={() => navigate(ROUTES.PROJECTS)}>
          Browse Projects
        </Button>
      </div>
    </div>
  );
}

