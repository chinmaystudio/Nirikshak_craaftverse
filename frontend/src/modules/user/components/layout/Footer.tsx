import { environment } from "@/config/environment";

export function Footer(): JSX.Element {
  const openPolicy = (key: string): void => {
    document.dispatchEvent(new CustomEvent("nirikshan:policy", { detail: key }));
  };

  const links: Array<{ key: string; label: string }> = [
    { key: "privacy", label: "Privacy Policy" },
    { key: "terms", label: "Terms of Service" },
    { key: "hyperlink", label: "Hyperlink Policy" },
    { key: "accessibility", label: "Accessibility Statement" },
    { key: "help", label: "Help & Support" },
    { key: "sitemap", label: "Site Map" }
  ];

  return (
    <footer className="bg-primary text-on-primary border-t-4 border-secondary-container mt-12 pb-20 lg:pb-0">
      <div className="w-full py-8 px-4 lg:px-8 mx-auto max-w-7xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-on-primary-container/20 pb-6">
          <div className="space-y-1">
            <div className="text-headline-sm font-bold text-on-primary">NIRIKSHAK — Public Infrastructure Transparency Portal</div>
            <div className="text-body-sm text-on-primary-container max-w-2xl">
              Content managed by Ministry of Housing and Urban Affairs, Government of India. Hosted by National Informatics Centre (NIC).
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-surface-container-lowest/10 rounded border border-on-primary-container/30 text-label-sm text-surface-container-lowest">
              GIGW 3.0 Compliant
            </div>
            <div className="px-3 py-1 bg-surface-container-lowest/10 rounded border border-on-primary-container/30 text-label-sm text-surface-container-lowest">
              ISO 27001 Certified
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-on-primary-container">
          {links.map((l) => (
            <button key={l.key} onClick={() => openPolicy(l.key)} className="hover:text-on-primary transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <div className="text-label-sm text-on-primary-container/80 flex flex-col md:flex-row justify-between items-center gap-2 border-t border-on-primary-container/20 pt-4">
          <div>© 2026 Government of India. All rights reserved. Version {environment.version}-NIRIKSHAK-STABLE.</div>
          <div>Last Updated: 11 September 2026 | Server Node: NIC-PUN-02</div>
        </div>
      </div>
    </footer>
  );
}
