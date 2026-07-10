/** Common English + job-posting boilerplate that carries no ATS signal. */
export const STOPWORDS: ReadonlySet<string> = new Set([
  // articles / conjunctions / prepositions
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "that",
  "this", "from", "have", "has", "not", "but", "all", "can", "who", "why",
  "how", "what", "when", "where", "into", "over", "under", "than", "then",
  "them", "they", "their", "there", "these", "those", "his", "her", "its",
  "was", "were", "been", "being", "such", "each", "any", "one", "two", "out",
  "off", "per", "via", "about", "across", "within", "while", "also", "may",
  "must", "should", "would", "could", "shall", "upon", "both", "more", "most",
  "other", "some", "only", "own", "same", "very", "just", "using", "use",
  "used", "well", "get", "make", "made",

  // job-posting boilerplate
  "job", "role", "roles", "position", "positions", "candidate", "candidates",
  "applicant", "applicants", "company", "team", "teams", "work", "working",
  "experience", "experienced", "years", "year", "required", "requirements",
  "requirement", "preferred", "responsibilities", "responsibility", "skills",
  "skill", "ability", "abilities", "strong", "excellent", "good", "great",
  "plus", "bonus", "nice", "looking", "seeking", "join", "opportunity",
  "opportunities", "benefits", "salary", "apply", "please", "including",
  "include", "includes", "etc", "ideal", "successful", "proven", "track",
  "record", "self", "highly", "closely", "across", "help", "helping",
  "ensure", "ensuring", "support", "supporting", "new", "day", "days",
  "employer", "equal", "diverse", "diversity", "inclusive", "environment",
  "culture", "office", "remote", "hybrid", "full", "time", "part",
]);

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}
