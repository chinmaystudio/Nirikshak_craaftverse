import { CreateProjectInput, ListProjectsQuery } from './projects.validation.js';

export interface ProjectListResult {
  projects: any[];
  total: number;
  limit: number;
  offset: number;
}
