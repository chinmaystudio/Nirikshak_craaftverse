import * as mockApi from './mockApi';
import * as supabaseApi from './supabaseApi';

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

const selectedApi = useMock ? mockApi : supabaseApi;

export const authApi = selectedApi.authApi;
export const projectsApi = selectedApi.projectsApi;
export const contractorsApi = selectedApi.contractorsApi;
export const approvalsApi = selectedApi.approvalsApi;
export const tendersApi = selectedApi.tendersApi;
export const grievancesApi = selectedApi.grievancesApi;
export const financeApi = selectedApi.financeApi;
export const auditApi = selectedApi.auditApi;
export const alertsApi = selectedApi.alertsApi;
export const documentsApi = selectedApi.documentsApi;
export const litigationApi = selectedApi.litigationApi;
export const workApi = selectedApi.workApi;
export const insightsApi = selectedApi.insightsApi;
export const citizenApi = selectedApi.citizenApi;
