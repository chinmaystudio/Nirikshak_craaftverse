interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "" }: IconProps): JSX.Element {
  return (
    <span className={`material-symbols-outlined align-middle ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
