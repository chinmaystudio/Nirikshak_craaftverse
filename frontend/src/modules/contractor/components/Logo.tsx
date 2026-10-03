import { cls } from '../lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo/nirikshak-icon.png"
      alt="NIRIKSHAK"
      className={cls("h-9 w-9 object-contain shrink-0", className)}
    />
  );
}

export default function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <img
        src="/logo/nirikshak-icon.png"
        alt="NIRIKSHAK"
        className={cls("h-9 w-9 object-contain shrink-0", className)}
      />
    );
  }

  return (
    <div className={cls("flex items-center gap-2.5 min-w-max", className)}>
      <img
        src="/logo/nirikshak-logo.png"
        alt="NIRIKSHAK"
        className="h-8 sm:h-9 w-auto object-contain shrink-0 dark:hidden"
      />
      <img
        src="/logo/nirikshak-logo-dark.png"
        alt="NIRIKSHAK"
        className="h-8 sm:h-9 w-auto object-contain shrink-0 hidden dark:block"
      />
      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
        Contractor
      </span>
    </div>
  );
}
