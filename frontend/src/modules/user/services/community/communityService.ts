import type { CommunityIssue, CommunityIssueView, CommunityStats, CommunityComment } from "@/types/community";
import { ApiError, latency, offlineGuard } from "@/services/api/client";
import { communityIssues } from "@/data/community";
import { appStore } from "@/app/providers/store";

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
    confirmPct: Math.min(99, Math.round((confirmations / issue.affected) * 100)),
    userConfirmed,
    userUpvoted,
    comments: [...issue.comments, ...extra]
  };
}

export async function getCommunityFeed(feed: CommunityFeed): Promise<CommunityIssueView[]> {
  offlineGuard();
  await latency(300, 600);
  let out = communityIssues.map(withUserState);
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
      out = out.filter((i) => i.ward.includes("Ward 12") || i.ward.includes("Ward 9") || i.ward.includes("Ward 14"));
  }
  return out;
}

export async function getCommunityIssue(id: string): Promise<CommunityIssueView> {
  offlineGuard();
  await latency(250, 500);
  const found = communityIssues.find((i) => i.id === id);
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
    open: communityIssues.filter((i) => i.status !== "resolved").length,
    resolved: communityIssues.filter((i) => i.status === "resolved").length,
    confirmations: communityIssues.reduce((acc, i) => acc + i.confirmations, 0),
    citizensAffected: communityIssues.reduce((acc, i) => acc + i.affected, 0)
  };
}
