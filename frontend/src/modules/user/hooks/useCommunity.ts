import { useAsync } from "./useAsync";
import { useAppState } from "@/app/providers/store";
import { getCommunityFeed, getCommunityStats, confirmIssue, upvoteIssue, addComment, type CommunityFeed } from "@/services/community/communityService";
import type { CommunityIssueView, CommunityStats } from "@/types/community";

export interface CommunityFeedResult {
  issues: CommunityIssueView[];
  stats: CommunityStats;
}

export function useCommunityFeed(feed: CommunityFeed): ReturnType<typeof useAsync<CommunityFeedResult>> {
  const confirmed = useAppState((s) => s.confirmed);
  const upvoted = useAppState((s) => s.upvoted);
  const comments = useAppState((s) => s.comments);

  return useAsync(
    () =>
      getCommunityFeed(feed).then((issues) => ({
        issues,
        stats: getCommunityStats()
      })),
    [feed, confirmed.length, upvoted.length, Object.keys(comments).length]
  );
}

export function useCommunityActions(): {
  confirm: (id: string) => Promise<void>;
  upvote: (id: string) => Promise<void>;
  comment: (id: string, text: string) => Promise<void>;
} {
  return {
    confirm: confirmIssue,
    upvote: upvoteIssue,
    comment: addComment
  };
}
