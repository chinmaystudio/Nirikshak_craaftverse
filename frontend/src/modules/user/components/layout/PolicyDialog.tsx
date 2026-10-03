import { Modal } from "@/components/common/Modal";
import { Icon } from "@/components/common/Icon";

export type PolicyKey = "privacy" | "terms" | "hyperlink" | "accessibility" | "help" | "sitemap";

interface Policy {
  title: string;
  body: string;
}

const POLICIES: Record<PolicyKey, Policy> = {
  privacy: {
    title: "Privacy Policy",
    body: "NIRIKSHAK collects only the minimum personal data required for grievance processing: your name, mobile number, ward and optional email. Evidence you upload is shared only with the concerned department for verification. Your identity is never published on community issue pages — confirmations are shown as aggregate counts. Photos taken with NIRIKSHAK Vision are processed to identify infrastructure and are stored only in your on-device history unless you attach them to a report. Data is retained per the Public Records Retention schedule and is never sold or shared with third parties."
  },
  terms: {
    title: "Terms of Service",
    body: "By using NIRIKSHAK you agree to file truthful reports. False or malicious complaints are liable for action under Section 182 of the applicable legal framework. Content on this portal is for public transparency and does not constitute a legal notice by itself. AI-assisted observations (including NIRIKSHAK Vision) are advisory and never constitute an official determination or a structural safety certification. Departments respond within the published SLA windows; escalations follow the CPGRAMS linkage."
  },
  hyperlink: {
    title: "Hyperlink Policy",
    body: "Links to external sites are provided for convenience. NIRIKSHAK does not endorse external content and is not responsible for its availability. External sites open in a new context and are governed by their own policies."
  },
  accessibility: {
    title: "Accessibility Statement",
    body: "This portal targets GIGW 3.0 and WCAG 2.1 AA. Features include keyboard navigation, skip links, A- / A / A+ text scaling, sufficient colour contrast, semantic landmarks and screen-reader labels. For accessibility assistance call the toll-free helpdesk 1800-11-2026."
  },
  help: {
    title: "Help & Support",
    body: "Toll-free citizen helpdesk: 1800-11-2026 (Mon–Sat, 9 AM–9 PM). Email: support@nirikshan.gov.in. For login or OTP issues, use the Login Assistance link on the sign-in page. Emergency infrastructure hazards should also be reported on helpline 112."
  },
  sitemap: {
    title: "Site Map",
    body: "Home → Nearby Projects → Project Transparency Dashboard → Identify Infrastructure (Vision) → Report an Issue → Complaint Status → Community → Alerts & Warnings → AI Assistant → Profile → Settings."
  }
};

interface PolicyDialogProps {
  policyKey: PolicyKey | null;
  onClose: () => void;
}

export function PolicyDialog({ policyKey, onClose }: PolicyDialogProps): JSX.Element | null {
  const policy = policyKey ? POLICIES[policyKey] : null;
  return (
    <Modal open={policy !== null} onClose={onClose} title={policy?.title ?? ""}>
      {policy ? (
        <>
          <div className="p-5 text-body-md text-on-surface-variant leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">{policy.body}</div>
          <div className="px-5 pb-5">
            <button onClick={onClose} className="w-full py-2 bg-primary text-on-primary rounded text-label-md font-label-md font-bold">
              Close
            </button>
          </div>
        </>
      ) : (
        <div className="p-5" />
      )}
      <span className="hidden">
        <Icon name="policy" />
      </span>
    </Modal>
  );
}
