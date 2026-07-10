/**
 * Common English + job-posting boilerplate that carries no ATS signal.
 *
 * NOTE: `tokenize` drops tokens shorter than 2 characters, so single letters
 * ("a", "i") never reach here. Everything two characters and up must be listed
 * explicitly — omitting "in"/"on"/"of"/"to" once let them rank as keywords.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  // prepositions, articles, conjunctions
  "an", "as", "at", "by", "in", "of", "on", "or", "to", "up", "so", "if",
  "the", "and", "for", "from", "into", "onto", "over", "under", "upon",
  "with", "within", "without", "across", "about", "after", "before",
  "between", "during", "through", "throughout", "toward", "towards", "than",
  "then", "while", "per", "via", "off", "out", "down",

  // pronouns
  "we", "us", "our", "ours", "you", "your", "yours", "they", "them", "their",
  "theirs", "he", "she", "him", "her", "hers", "his", "it", "its", "me", "my",
  "who", "whom", "whose", "which", "what", "when", "where", "why", "how",
  "this", "that", "these", "those", "there", "here",

  // auxiliaries / copulas
  "am", "is", "are", "was", "were", "be", "been", "being", "do", "does",
  "did", "doing", "have", "has", "had", "having", "will", "shall", "would",
  "should", "could", "can", "may", "might", "must", "not", "no",

  // generic filler
  "all", "any", "both", "each", "else", "every", "few", "more", "most",
  "much", "one", "two", "other", "others", "own", "same", "some", "such",
  "very", "just", "also", "well", "get", "make", "made", "use", "used",
  "using", "new", "day", "days", "like", "many", "across", "within",

  // job-posting boilerplate
  "job", "jobs", "role", "roles", "position", "positions", "candidate",
  "candidates", "applicant", "applicants", "company", "team", "teams",
  "work", "working", "works", "experience", "experienced", "years", "year",
  "required", "require", "requires", "requirements", "requirement",
  "preferred", "responsibilities", "responsibility", "skills", "skill",
  "ability", "abilities", "strong", "excellent", "good", "great", "plus",
  "bonus", "nice", "looking", "seeking", "join", "opportunity",
  "opportunities", "benefits", "salary", "apply", "please", "including",
  "include", "includes", "etc", "ideal", "successful", "proven", "track",
  "record", "self", "highly", "closely", "help", "helping", "ensure",
  "ensuring", "support", "supporting", "employer", "equal", "diverse",
  "diversity", "inclusive", "environment", "culture", "office", "remote",
  "hybrid", "full", "time", "part", "us", "role", "want", "wants", "need",
  "needs", "able", "you'll", "we're",
]);

export function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}
