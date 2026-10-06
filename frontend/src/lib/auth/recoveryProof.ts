let recoveryProof: string | null = null;

export function captureRecoveryProof(): void {
  if (window.location.pathname !== '/government/reset-password') return;

  const fragment = new URLSearchParams(window.location.hash.slice(1));
  if (fragment.get('type') !== 'recovery') return;

  recoveryProof = fragment.get('access_token');
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

export function getRecoveryProof(): string | null {
  return recoveryProof;
}

export function clearRecoveryProof(): void {
  recoveryProof = null;
}
