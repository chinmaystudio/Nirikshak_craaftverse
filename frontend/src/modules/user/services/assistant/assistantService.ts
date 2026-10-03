import type { AssistantReply, ChatMessage } from "@/types/api";
import type { Project } from "@/types/project";
import { latency } from "@/services/api/client";
import { nearbyProjects, projectsData, findProject } from "@/services/projects/projectsService";
import { getMyComplaints } from "@/services/complaints/complaintsService";
import { criticalUnreadAlerts } from "@/services/alerts/alertsService";
import { ward as wardStats } from "@/data/ward";
import { isLoggedIn, currentUser } from "@/services/auth/authService";

export interface AssistantContext {
  projectId?: string;
}

function nearbySummary(): Array<{ name: string; sub: string; id: string; progress: number; status: string }> {
  return nearbyProjects(3).map((p: Project) => ({
    name: p.name,
    sub: `${p.category} • ${p.distanceKm != null ? `${p.distanceKm} km away` : p.ward}`,
    id: p.id,
    progress: p.progress,
    status: p.status
  }));
}

export async function respond(text: string, ctx: AssistantContext | null): Promise<AssistantReply> {
  const q = text.toLowerCase();
  const user = currentUser();
  const delay = 700 + Math.random() * 700;

  const make = (reply: AssistantReply): Promise<AssistantReply> => latency(delay, delay + 500).then(() => reply);

  if (/\b(hi|hello|hey|namaste|namaskar)\b/.test(q) && q.length < 30) {
    return make({
      text: `${user ? `Hello ${user.name.split(" ")[0]}` : "Hello"}. I am your NIRIKSHAK civic assistant. I can help you find nearby projects, explain budgets and delays, report an issue, or track your complaints.`,
      chips: ["What projects are near me?", "I want to report a pothole", "Show my complaints", "How much money has been spent in my ward?"]
    });
  }

  if (/(photo|picture|identify|what is this|vision|camera|scan)/.test(q)) {
    return make({
      text: "NIRIKSHAK Vision can assist with identifying public infrastructure from a photo and matching it to published project records. Government verification remains authoritative.",
      actions: [{ label: "Identify Infrastructure", icon: "photo_camera", route: "#/vision" }],
      chips: ["I want to report a pothole", "What projects are near me?"]
    });
  }

  if (/(report|lodge|file).*(pothole|issue|complaint|problem|leak|damage|garbage|dust)|^(report|pothole)/.test(q) || q.includes("pothole")) {
    return make({
      text: "I can help you report it. Where is the issue located? You can attach your current GPS location or pick the spot on the ward map — both work offline in the field.",
      actions: [
        { label: "Use Current Location", icon: "my_location", action: "report-location" },
        { label: "Select on Map", icon: "map", action: "report-map" }
      ],
      chips: ["What happens after I submit?", "Which department will handle it?"]
    });
  }

  if (/(my|track|show).*(complaint|grievance)|complaint.*status|status.*complaint/.test(q)) {
    if (!isLoggedIn()) {
      return make({
        text: "Please sign in first — I can then pull up your complaints with live SLA status.",
        actions: [{ label: "Login", icon: "login", route: "#/login" }]
      });
    }
    const list = await getMyComplaints();
    const active = list.filter((c) => c.status !== "resolved" && c.status !== "closed");
    const lines = active
      .slice(0, 3)
      .map((c) => `• ${c.id} — ${c.title.slice(0, 48)}… (${c.status})`)
      .join("\n");
    return make({
      text: `You have ${active.length} active complaint(s):\n${lines}\n\nYou can open any complaint for its full timeline and SLA countdown.`,
      actions: [{ label: "Open My Complaints", icon: "receipt_long", route: "#/complaints" }],
      chips: ["What does SLA breached mean?", "How do I escalate a complaint?"]
    });
  }

  if (/(delay|late|behind|stuck|slow|why.*time)/.test(q)) {
    const project = (ctx?.projectId ? findProject(ctx.projectId) : undefined) ?? projectsData.find((p) => p.id === "katraj-kondhwa-road");
    if (!project) {
      return make({ text: "I could not find that project. Try asking about projects near you." });
    }
    if (project.delay) {
      const penaltyAmount = /([\d.]+)/.exec(project.delay.penalty)?.[1] ?? "?";
      return make({
        text: `${project.name} is delayed: ${project.delay.reason} The completion target was revised to ${project.delay.revisedCompletion.slice(0, 10)} and ₹${penaltyAmount} Cr of liquidated damages has been invoked. The delay is published on the project timeline with the official notice.`,
        actions: [
          { label: "View Project Timeline", icon: "timeline", route: `#/projects/${project.id}?tab=timeline` },
          { label: "Report a Delay Concern", icon: "report", route: `#/report?project=${project.id}` }
        ]
      });
    }
    return make({
      text: `${project.name} is currently on track — no delay recorded. ${project.progress}% of work is complete against plan.`,
      actions: [{ label: "View Project", icon: "open_in_new", route: `#/projects/${project.id}` }]
    });
  }

  if (/(who|responsible|accountab|contractor|engineer)/.test(q)) {
    const project = (ctx?.projectId ? findProject(ctx.projectId) : undefined) ?? nearbyProjects(1)[0];
    return make({
      text: `For ${project.name}, the executing agency is ${project.agency} and the works contractor is ${project.contractor.name} (contract ₹${project.contractor.contractValue} Cr). On-time performance: ${project.contractor.performance.onTime}, quality rating ${project.contractor.performance.quality}. The supervising engineer is ${project.engineer}. All of this is public on the project page.`,
      actions: [{ label: "Open Contractor Profile", icon: "engineering", route: `#/projects/${project.id}?tab=contractor` }],
      chips: ["How are contractors penalised?", "Which projects has this contractor done before?"]
    });
  }

  if (/(money|spent|budget|cost|fund|expenditure|kharcha|paisa)/.test(q)) {
    return make({
      text: `In ${wardStats.name}, ₹${wardStats.spentFYCr} Cr has been spent this financial year against ₹${wardStats.totalValueCr} Cr of sanctioned project value (${wardStats.expenditurePct}% utilisation). The largest active outlay is Pune Metro Line 3, followed by the Katraj–Kondhwa road works. Every rupee is traceable on each project's Financial Transparency tab.`,
      actions: [
        { label: "See Ward Accountability", icon: "account_balance", route: "#/home" },
        { label: "Open Project Budgets", icon: "payments", route: "#/projects" }
      ]
    });
  }

  if (/(project|nearby|near me|around|going on|happening|chalu|suru)/.test(q)) {
    const near = nearbySummary();
    const lines = near.map((p) => `• ${p.name} — ${p.sub} (${p.progress}% ${p.status})`).join("\n");
    return make({
      text: `Here are the active projects closest to you:\n${lines}\n\nWant details, budgets or timelines for any of these?`,
      actions: [
        { label: `Open ${near[0].name.split("(")[0].trim()}`, icon: "open_in_new", route: `#/projects/${near[0].id}` },
        { label: "View on Ward Map", icon: "map", route: "#/projects?view=map" }
      ]
    });
  }

  if (/(alert|warning|closure|flood|emergency|danger)/.test(q)) {
    const crit = criticalUnreadAlerts();
    return make({
      text: crit.length
        ? `There ${crit.length === 1 ? "is 1 critical alert" : `are ${crit.length} critical alerts`} right now:\n• ${crit[0].title}\n\nPlease follow the advisories for your area.`
        : "No critical alerts right now. The latest advisory is about desilting works along the riverfront park (14–18 Sep, 7–11 AM).",
      actions: [{ label: "Open Alerts Centre", icon: "notifications_active", route: "#/alerts" }]
    });
  }

  if (/(sla|breach|escalat)/.test(q)) {
    return make({
      text: "Every complaint carries an SLA: 24h for High priority, 48h for Medium, 72h for Normal. If the department misses the deadline, the complaint is automatically escalated to the department head and marked SLA BREACHED on your dashboard. You can also escalate manually or reopen a closed complaint with new evidence.",
      actions: [{ label: "My Complaints", icon: "receipt_long", route: "#/complaints" }]
    });
  }

  if (/(help|what can you|kya kar)/.test(q) || q.trim() === "") {
    return make({
      text: "I can help with:\n• Finding projects near you\n• Explaining budgets, delays and contractor accountability\n• Identifying infrastructure from a photo\n• Guided issue reporting with AI verification\n• Tracking your complaints and SLA status\n• Critical alerts in your area",
      chips: ["What projects are near me?", "I want to report a pothole", "Why is a project delayed?", "Show my complaints"]
    });
  }

  return make({
    text: "I did not fully catch that. Try asking about projects near you, a project's budget or delay, reporting an issue, or your complaint status.",
    chips: ["What projects are near me?", "I want to report a pothole", "Show my complaints", "How much money has been spent?"]
  });
}

export function initialChatMessage(): ChatMessage {
  return {
    role: "assistant",
    text: 'Namaste. I am your NIRIKSHAK civic assistant. Choose a task below, or ask me anything about public infrastructure near you.',
    actions: [
      { label: "Find a project", icon: "search", route: "#/projects" },
      { label: "Report an issue", icon: "report", action: "report-map" },
      { label: "Identify with a photo", icon: "photo_camera", route: "#/vision" },
      { label: "Track complaint", icon: "receipt_long", route: "#/complaints" },
      { label: "Show nearby alerts", icon: "notifications_active", route: "#/alerts" }
    ],
    chips: ["What projects are near me?", "Why is a project delayed?", "How much money has been spent?", "Who is responsible for this road?"]
  };
}
