import type { Project } from "@/types/project";

export const projectImages: Record<string, string> = {
  metro: '',
  coastal: '',
  ring: '',
  rrts: '',
  pier: '',
  gantry: '',
};

export const projects: Project[] = [];

export function findProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
