/**
 * A curated skills taxonomy. Terms found here are boosted during keyword
 * extraction, so a JD mentioning "kubernetes" once outranks a filler word
 * mentioned three times.
 *
 * This is deliberately a starting set, not exhaustive. Phase 2 supplements it
 * with LLM extraction; an O*NET/ESCO import can replace it wholesale later.
 */
export const SKILL_TAXONOMY: ReadonlySet<string> = new Set([
  // languages
  "javascript", "typescript", "python", "java", "kotlin", "swift", "go",
  "golang", "rust", "ruby", "php", "scala", "elixir", "c++", "c#", "sql",
  "html", "css", "bash", "r", "matlab",

  // web / frontend
  "react", "next.js", "nextjs", "vue", "angular", "svelte", "redux",
  "tailwind", "webpack", "vite", "graphql", "rest", "accessibility", "wcag",
  "responsive design", "design systems", "front-end", "frontend",

  // backend / data
  "node.js", "nodejs", "express", "django", "flask", "rails", "spring",
  "postgres", "postgresql", "mysql", "mongodb", "redis", "kafka",
  "elasticsearch", "microservices", "api design", "back-end", "backend",
  "etl", "data modeling", "pandas", "numpy", "spark", "airflow", "dbt",

  // cloud / infra
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ansible",
  "ci/cd", "jenkins", "github actions", "observability", "prometheus",
  "grafana", "linux", "serverless", "devops", "sre",

  // ml / ai
  "machine learning", "deep learning", "nlp", "pytorch", "tensorflow",
  "scikit-learn", "llm", "computer vision", "recommendation systems",

  // design
  "figma", "sketch", "prototyping", "wireframing", "user research",
  "usability testing", "interaction design", "visual design", "ux", "ui",
  "design thinking",

  // product / business
  "product management", "roadmap", "stakeholder management", "agile", "scrum",
  "kanban", "jira", "okrs", "a/b testing", "analytics", "sql reporting",
  "go-to-market", "p&l", "forecasting", "budgeting", "salesforce", "hubspot",
  "seo", "sem", "crm", "kpi",

  // leadership / soft (still ATS keywords)
  "leadership", "mentoring", "coaching", "cross-functional", "collaboration",
  "communication", "strategy", "negotiation", "hiring", "onboarding",
]);

export function isKnownSkill(term: string): boolean {
  return SKILL_TAXONOMY.has(term);
}
