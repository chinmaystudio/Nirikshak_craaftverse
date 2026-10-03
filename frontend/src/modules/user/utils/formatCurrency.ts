export function formatCr(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  const rounded = Math.round(amount * 10) / 10;
  const parts = String(rounded).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₹${parts.join(".")} Cr`;
}

export function remainingFunds(revised: number, spent: number, completed: boolean): string {
  if (completed) return "Defect-liability retained";
  return formatCr(Math.max(0, revised - spent));
}

export function formatMoneyText(text: string | null | undefined): string {
  return text || "—";
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}
