export const ROUTES = {
  LANDING: "/user",
  APP: "/user/home",
  HOME: "/user/home",
  LOGIN: "/user/login",
  REGISTER: "/user/register",
  PROJECTS: "/user/projects",
  REPORT: "/user/report",
  REPORT_SUCCESS: "/user/report/success",
  COMPLAINTS: "/user/complaints",
  COMMUNITY: "/user/community",
  ALERTS: "/user/alerts",
  VISION: "/user/vision",
  VISION_HISTORY: "/user/vision/history",
  ASSISTANT: "/user/assistant",
  PROFILE: "/user/profile",
  SETTINGS: "/user/settings"
} as const;

export const projectRoute = (id: string): string => `/user/projects/${encodeURIComponent(id)}`;
export const complaintRoute = (id: string): string => `/user/complaints/${encodeURIComponent(id)}`;
export const communityIssueRoute = (id: string): string => `/user/community/${encodeURIComponent(id)}`;
export const alertRoute = (id: string): string => `/user/alerts/${encodeURIComponent(id)}`;
export const visionResultRoute = (id: string): string => `/user/vision/result/${encodeURIComponent(id)}`;
