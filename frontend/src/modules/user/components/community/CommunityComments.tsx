import { useState, type FormEvent } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { relativeTime } from "@/utils/formatDate";
import type { CommunityIssueView, CommunityComment } from "@/types/community";

export function CommentsSection({
  issue,
  onSubmit
}: {
  issue: CommunityIssueView;
  onSubmit: (text: string) => void;
}): JSX.Element {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (text.trim().length < 4) {
      setError("Please write at least 4 characters.");
      return;
    }
    setError(null);
    onSubmit(text.trim());
    setText("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-headline-sm font-bold text-primary">
        Citizen Discussion <span className="text-outline font-normal text-body-sm">({issue.comments.length})</span>
      </h3>
      {issue.comments.length > 0 ? (
        <div className="space-y-4">
          {issue.comments.map((c: CommunityComment, i) => (
            <div
              key={`${c.author}-${i}`}
              className={`${
                c.official ? "bg-surface-container-low border-l-4 border-secondary" : "bg-surface-container-lowest border border-outline-variant/40"
              } p-3.5 rounded-lg`}
            >
              <div className="flex items-center gap-2 text-label-sm font-label-sm mb-1">
                <span
                  className={`w-7 h-7 rounded-full ${
                    c.official ? "bg-secondary text-on-secondary" : "bg-surface-container text-primary"
                  } flex items-center justify-center font-bold text-[12px]`}
                >
                  {c.author[0]}
                </span>
                <span className="font-bold text-primary">{c.author}</span>
                {c.official ? (
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wide flex items-center gap-0.5">
                    <Icon name="verified" className="text-[12px]" /> Official
                  </span>
                ) : null}
                {c.ward ? <span className="text-outline">{c.ward}</span> : null}
                <span className="text-outline ml-auto">{relativeTime(c.at)}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant">No citizen comments yet. Be the first to add verified observations.</p>
      )}
      <form className="space-y-2" aria-label="Add a comment" onSubmit={submit}>
        <label htmlFor="comment-input" className="block text-label-md font-label-md text-primary">
          Add a civic observation
        </label>
        <textarea
          id="comment-input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share verified facts, dates or impact — keep it civic and constructive…"
          className="w-full px-3 py-2 border border-outline-variant rounded text-body-md focus:ring-2 focus:ring-primary-container focus:border-transparent"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-sm text-outline">{error ?? "Comments are public and moderated for civility."}</span>
          <Button type="submit">Post Comment</Button>
        </div>
      </form>
    </div>
  );
}
