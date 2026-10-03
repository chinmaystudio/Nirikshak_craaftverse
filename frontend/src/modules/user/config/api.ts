import { environment } from "./environment";

export const apiConfig = {
  baseUrl: (): string => environment.apiBaseUrl,
  endpoint: (path: string): string => `${environment.apiBaseUrl}${path}`,
  isDemo: (): boolean => environment.demoMode
};
