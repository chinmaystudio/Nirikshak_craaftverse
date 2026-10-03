import type { CommunityIssue, CommunityIssueView, CommunityStats, CommunityComment } from "@/types/community";
import { ApiError, latency, offlineGuard } from "@/services/api/client";
import { appStore } from "@/app/providers/store";
import { supabase } from "@/core/supabase/client";

export type CommunityFeed = "nearby" | "trending" | "recent" | "supported" | "resolved";

function withUserState(issue: CommunityIssue): CommunityIssueView {
  const s = appStore.getState();
  const userConfirmed = s.confirmed.includes(issue.id);
  const userUpvoted = s.upvoted.includes(issue.id);
  const extra = s.comments[issue.id] ?? [];
  const confirmations = issue.confirmations + (userConfirmed ? 1 : 0);
  return {
    ...issue,
    confirmations,
    upvotes: issue.upvotes + (userUpvoted ? 1 : 0),
    confirmPct: Math.min(99, Math.round((confirmations / (issue.affected || 1)) * 100)),
    userConfirmed,
    userUpvoted,
    comments: [...issue.comments, ...extra]
  };
}

let cachedIssues: CommunityIssue[] = [];

export async function getCommunityFeed(feed: CommunityFeed): Promise<CommunityIssueView[]> {
  offlineGuard();
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, projects(project_name, nirikshak_project_id)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      cachedIssues = data.map((c: any) => ({
        id: c.reference_number || c.id,
        title: c.title || 'Civic Infrastructure Concern',
        category: c.category || 'road-damage',
        projectId: c.projects?.nirikshak_project_id || c.project_id || null,
        ward: c.ward || 'Ward 12 — Kothrud / Shivajinagar',
        location: c.location_text || 'Pune Municipal Region',
        reportedBy: 'Citizen',
        reportedAt: c.created_at || new Date().toISOString(),
        affected: 1,
        confirmations: 0,
        upvotes: 0,
        status: (c.status === 'RESOLVED' ? 'resolved' : c.status === 'IN_PROGRESS' ? 'action-taken' : 'open') as any,
        description: c.description || '',
        confirmers: [],
        evidence: [],
        timeline: [
          {
            id: 'tl-1',
            title: 'Issue Reported',
            description: 'Reported by local resident on NIRIKSHAK.',
            date: c.created_at || new Date().toISOString(),
            status: 'completed',
          },
        ],
        comments: [],
        govResponse: null,
        resolution: null,
      }));
    } else {
      cachedIssues = [];
    }
  } catch (err) {
    console.warn('Failed to fetch community issues from Supabase:', err);
    cachedIssues = [];
  }

  let out = cachedIssues.map(withUserState);
  switch (feed) {
    case "trending":
      out = [...out].sort((a, b) => b.upvotes - a.upvotes);
      break;
    case "recent":
      out = [...out].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
      break;
    case "supported":
      out = [...out].sort((a, b) => b.affected - a.affected);
      break;
    case "resolved":
      out = out.filter((i) => i.status === "resolved");
      break;
    default:
      break;
  }
  return out;
}


export async function getCommunityIssue(id: string): Promise<CommunityIssueView> {
  offlineGuard();
  if (cachedIssues.length === 0) {
    await getCommunityFeed('recent');
  }
  const found = cachedIssues.find((i) => i.id === id);
  if (!found) {
    throw new ApiError({ message: "Community issue not found. It may have been merged or closed.", notFound: true });
  }
  return withUserState(found);
}

export async function confirmIssue(id: string): Promise<void> {
  await latency(200, 400);
  const confirmed = appStore.getState().confirmed;
  if (!confirmed.includes(id)) {
    appStore.setState({ confirmed: [...confirmed, id] });
  }
}

export async function upvoteIssue(id: string): Promise<void> {
  await latency(200, 400);
  const upvoted = appStore.getState().upvoted;
  if (!upvoted.includes(id)) {
    appStore.setState({ upvoted: [...upvoted, id] });
  }
}

export async function addComment(id: string, text: string): Promise<void> {
  await latency(300, 500);
  const s = appStore.getState();
  const user = s.user;
  const comment: CommunityComment = {
    author: user?.name ?? "You",
    you: true,
    ward: (user?.ward ?? "Ward 12").split("—")[0].trim(),
    at: new Date().toISOString(),
    text
  };
  appStore.setState({
    comments: { ...s.comments, [id]: [...(s.comments[id] ?? []), comment] }
  });
}

export function getCommunityStats(): CommunityStats {
  return {
    open: cachedIssues.filter((i) => i.status !== "resolved").length,
    resolved: cachedIssues.filter((i) => i.status === "resolved").length,
    confirmations: cachedIssues.reduce((acc, i) => acc + i.confirmations, 0),
    citizensAffected: cachedIssues.reduce((acc, i) => acc + i.affected, 0)
  };
}

