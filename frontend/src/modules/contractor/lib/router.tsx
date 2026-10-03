import { useEffect, useState } from 'react';
import type { ReactNode, MouseEvent } from 'react';

export function getHash(): string {
  const p = window.location.pathname.replace(/\\/g, '/');
  let h = p === '/contractor' || p === '/contractor/' ? '/dashboard' : p.replace(/^\/contractor/, '');
  if (h && !h.startsWith('/')) {
    h = '/' + h;
  }
  return h;
}

export function navigate(to: string) {
  const norm = to.startsWith('#') ? to.slice(1) : to;
  const target = norm.startsWith('/') ? norm : `/${norm}`;
  if (getHash() === target) return;
  window.history.pushState(null, '', `/contractor${target}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePath(): string {
  const [p, setP] = useState(getHash());
  useEffect(() => {
    const f = () => setP(getHash());
    window.addEventListener('popstate', f);
    return () => window.removeEventListener('popstate', f);
  }, []);
  return p;
}

export function Link({
  to,
  children,
  className,
  title,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}) {
  const handle = (e: MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };
  return (
    <a href={`/contractor${to}`} className={className} title={title} onClick={(e) => { e.preventDefault(); handle(e); navigate(to); }}>
      {children}
    </a>
  );
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const sp = path.split('/').filter(Boolean);
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
    else if (pp[i] !== sp[i]) return null;
  }
  return params;
}

export function isActive(path: string, target: string): boolean {
  if (target === path) return true;
  return path.startsWith(target + '/');
}
