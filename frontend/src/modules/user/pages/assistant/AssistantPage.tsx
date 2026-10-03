import { ChatPanel } from "@/components/ai/AssistantWidget";
import { Icon } from "@/components/common/Icon";
import { useT } from "@/hooks/useT";

const CAPABILITIES = [
  "Find infrastructure projects near you",
  "Explain budgets, costs and delays",
  "Identify contractors and accountability",
  "Guide you through reporting an issue",
  "Track your complaints and SLA status",
  "Surface critical alerts in your area"
];

export function AssistantPage(): JSX.Element {
  const { t } = useT();
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
            <Icon name="smart_toy" className="text-[26px]" />
          </span>
          <div>
            <h1 className="text-headline-sm font-bold text-primary">NIRIKSHAK Civic Assistant</h1>
            <p className="text-label-sm text-on-surface-variant">AI guidance over public records — advisory, not official decisions.</p>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-outline-variant/30">
          <div className="text-label-md font-bold text-primary pt-1">What I can help with</div>
          {CAPABILITIES.map((x) => (
            <div key={x} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <span className="text-secondary mt-0.5">
                <Icon name="check_circle" className="text-[16px]" />
              </span>
              {x}
            </div>
          ))}
        </div>
        <div className="bg-surface-container-low p-3 rounded-lg text-label-sm text-on-surface-variant space-y-1.5">
          <div className="font-bold text-primary">Try asking</div>
          {[
            "What projects are happening near me?",
            "Why is this project delayed?",
            "Who is responsible for this road?",
            "How much money has been spent?",
            "I want to report a pothole.",
            "Show my complaints."
          ].map((q) => (
            <div key={q} className="px-2.5 py-1.5 rounded border border-outline-variant/50 bg-surface-container-lowest text-primary">
              "{q}"
            </div>
          ))}
        </div>
        <span className="hidden">{t("assistant")}</span>
      </aside>
      <section className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden" style={{ minHeight: "70vh" }}>
        <ChatPanel embedded />
      </section>
    </div>
  );
}
