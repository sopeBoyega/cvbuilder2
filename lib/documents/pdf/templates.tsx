import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer";

import type { ResumeContent, WorkEntry } from "@/lib/validation/resume";

/**
 * ATS-safe PDF templates.
 *
 * Rules every template here obeys, because ATS parsers break on the opposite:
 *  - Real selectable text. Never an image, never a canvas screenshot.
 *  - One column. Multi-column layouts get read left-to-right across columns.
 *  - No tables. No text in headers/footers.
 *  - Standard PDF fonts only (Helvetica / Times-Roman). These are built into
 *    react-pdf, so there is no `Font.register` and no network fetch at render
 *    time — which also means export never fails because a CDN is down.
 */

/** `end: null` means the role is current. */
function formatRange(start?: string, end?: string | null): string {
  if (!start && end === undefined) return "";
  const endLabel = end === null ? "Present" : (end ?? "");
  return [start, endLabel].filter(Boolean).join(" – ");
}

function contactLine(basics: ResumeContent["basics"]): string {
  return [basics.email, basics.phone, basics.location].filter(Boolean).join("  •  ");
}

/* ------------------------------------------------------------------ */
/* The Executive Modern — bold header, generous whitespace              */
/* ------------------------------------------------------------------ */

const executive = StyleSheet.create({
  page: { paddingVertical: 44, paddingHorizontal: 52, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a", lineHeight: 1.5 },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: -0.5 },
  headline: { fontSize: 11, color: "#444444", marginTop: 4 },
  contact: { fontSize: 9, color: "#555555", marginTop: 6 },
  rule: { borderBottomWidth: 2, borderBottomColor: "#1a1a1a", marginTop: 12, marginBottom: 18 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 1.4, marginBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  role: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  company: { fontSize: 10, color: "#444444" },
  dates: { fontSize: 9, color: "#666666" },
  bullet: { flexDirection: "row", marginTop: 3, paddingRight: 8 },
  bulletDot: { width: 10 },
  entry: { marginBottom: 10 },
  link: { fontSize: 9, color: "#1a1a1a", textDecoration: "none" },
});

// Typed as `Styles` (not a specific sheet) so all three templates can share
// these blocks — `StyleSheet.create<T extends Styles>` returns T, so every
// sheet is assignable here.
function Bullets({ bullets, style }: { bullets: string[]; style: Styles }) {
  return (
    <>
      {bullets.map((bullet, index) => (
        <View key={index} style={style.bullet}>
          <Text style={style.bulletDot}>•</Text>
          <Text>{bullet}</Text>
        </View>
      ))}
    </>
  );
}

function WorkBlock({ entry, style }: { entry: WorkEntry; style: Styles }) {
  return (
    <View style={style.entry} wrap={false}>
      <View style={style.entryHeader}>
        <Text style={style.role}>{entry.role}</Text>
        <Text style={style.dates}>{formatRange(entry.start, entry.end)}</Text>
      </View>
      <Text style={style.company}>
        {[entry.company, entry.location].filter(Boolean).join(" — ")}
      </Text>
      <Bullets bullets={entry.bullets} style={style} />
    </View>
  );
}

export function ExecutiveModern({ content }: { content: ResumeContent }) {
  const { basics } = content;
  return (
    <Document title={basics.name} author={basics.name}>
      <Page size="A4" style={executive.page}>
        <Text style={executive.name}>{basics.name}</Text>
        {basics.headline ? (
          <Text style={executive.headline}>{basics.headline}</Text>
        ) : null}
        <Text style={executive.contact}>{contactLine(basics)}</Text>
        {basics.links.map((link) => (
          <Link key={link.url} src={link.url} style={executive.link}>
            {link.label ?? link.url}
          </Link>
        ))}
        <View style={executive.rule} />

        {content.summary ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>SUMMARY</Text>
            <Text>{content.summary}</Text>
          </View>
        ) : null}

        {content.work.length > 0 ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>EXPERIENCE</Text>
            {content.work.map((entry, index) => (
              <WorkBlock key={index} entry={entry} style={executive} />
            ))}
          </View>
        ) : null}

        {content.projects.length > 0 ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>PROJECTS</Text>
            {content.projects.map((project, index) => (
              <View key={index} style={executive.entry} wrap={false}>
                <Text style={executive.role}>{project.name}</Text>
                {project.description ? <Text>{project.description}</Text> : null}
                <Bullets bullets={project.bullets} style={executive} />
              </View>
            ))}
          </View>
        ) : null}

        {content.education.length > 0 ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>EDUCATION</Text>
            {content.education.map((entry, index) => (
              <View key={index} style={executive.entryHeader}>
                <Text>
                  <Text style={executive.role}>{entry.school}</Text>
                  {entry.degree || entry.field
                    ? ` — ${[entry.degree, entry.field].filter(Boolean).join(", ")}`
                    : ""}
                </Text>
                <Text style={executive.dates}>
                  {formatRange(entry.start, entry.end)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {content.skills.length > 0 ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>SKILLS</Text>
            <Text>{content.skills.join(", ")}</Text>
          </View>
        ) : null}

        {content.certifications.length > 0 ? (
          <View style={executive.section}>
            <Text style={executive.sectionTitle}>CERTIFICATIONS</Text>
            {content.certifications.map((cert, index) => (
              <Text key={index}>
                {[cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ")}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* Global Standard — centred serif header, conservative, parses anywhere*/
/* ------------------------------------------------------------------ */

const classic = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontFamily: "Times-Roman", fontSize: 10.5, color: "#000000", lineHeight: 1.45 },
  name: { fontSize: 20, fontFamily: "Times-Bold", textAlign: "center" },
  headline: { fontSize: 11, textAlign: "center", marginTop: 3 },
  contact: { fontSize: 9.5, textAlign: "center", marginTop: 5 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#000000", marginTop: 10, marginBottom: 14 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10.5, fontFamily: "Times-Bold", letterSpacing: 0.8, borderBottomWidth: 0.5, borderBottomColor: "#666666", paddingBottom: 2, marginBottom: 7 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  role: { fontSize: 10.5, fontFamily: "Times-Bold" },
  company: { fontSize: 10, fontStyle: "italic" },
  dates: { fontSize: 9.5 },
  bullet: { flexDirection: "row", marginTop: 2, paddingRight: 8 },
  bulletDot: { width: 10 },
  entry: { marginBottom: 9 },
  link: { fontSize: 9.5, color: "#000000", textDecoration: "none", textAlign: "center" },
});

export function GlobalStandard({ content }: { content: ResumeContent }) {
  const { basics } = content;
  return (
    <Document title={basics.name} author={basics.name}>
      <Page size="A4" style={classic.page}>
        <Text style={classic.name}>{basics.name}</Text>
        {basics.headline ? (
          <Text style={classic.headline}>{basics.headline}</Text>
        ) : null}
        <Text style={classic.contact}>{contactLine(basics)}</Text>
        <View style={classic.rule} />

        {content.summary ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <Text>{content.summary}</Text>
          </View>
        ) : null}

        {content.work.length > 0 ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
            {content.work.map((entry, index) => (
              <WorkBlock key={index} entry={entry} style={classic} />
            ))}
          </View>
        ) : null}

        {content.education.length > 0 ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>EDUCATION</Text>
            {content.education.map((entry, index) => (
              <View key={index} style={classic.entryHeader}>
                <Text>
                  <Text style={classic.role}>{entry.school}</Text>
                  {entry.degree || entry.field
                    ? ` — ${[entry.degree, entry.field].filter(Boolean).join(", ")}`
                    : ""}
                </Text>
                <Text style={classic.dates}>
                  {formatRange(entry.start, entry.end)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {content.skills.length > 0 ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>SKILLS</Text>
            <Text>{content.skills.join(", ")}</Text>
          </View>
        ) : null}

        {content.projects.length > 0 ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>PROJECTS</Text>
            {content.projects.map((project, index) => (
              <View key={index} style={classic.entry} wrap={false}>
                <Text style={classic.role}>{project.name}</Text>
                {project.description ? <Text>{project.description}</Text> : null}
                <Bullets bullets={project.bullets} style={classic} />
              </View>
            ))}
          </View>
        ) : null}

        {content.certifications.length > 0 ? (
          <View style={classic.section}>
            <Text style={classic.sectionTitle}>CERTIFICATIONS</Text>
            {content.certifications.map((cert, index) => (
              <Text key={index}>
                {[cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ")}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/* The Tech Vanguard — dense, skills and projects forward               */
/* ------------------------------------------------------------------ */

const vanguard = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 9.5, color: "#111111", lineHeight: 1.38 },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 10, color: "#333333", marginTop: 2 },
  contact: { fontSize: 8.5, color: "#444444", marginTop: 4 },
  rule: { borderBottomWidth: 0.75, borderBottomColor: "#999999", marginTop: 9, marginBottom: 12 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.1, marginBottom: 5 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 },
  role: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  company: { fontSize: 9.5, color: "#333333" },
  dates: { fontSize: 8.5, color: "#666666" },
  bullet: { flexDirection: "row", marginTop: 2, paddingRight: 6 },
  bulletDot: { width: 9 },
  entry: { marginBottom: 8 },
  link: { fontSize: 8.5, color: "#111111", textDecoration: "none" },
});

export function TechVanguard({ content }: { content: ResumeContent }) {
  const { basics } = content;
  return (
    <Document title={basics.name} author={basics.name}>
      <Page size="A4" style={vanguard.page}>
        <Text style={vanguard.name}>{basics.name}</Text>
        {basics.headline ? (
          <Text style={vanguard.headline}>{basics.headline}</Text>
        ) : null}
        <Text style={vanguard.contact}>{contactLine(basics)}</Text>
        <View style={vanguard.rule} />

        {content.skills.length > 0 ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>TECHNICAL SKILLS</Text>
            <Text>{content.skills.join("  •  ")}</Text>
          </View>
        ) : null}

        {content.summary ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>SUMMARY</Text>
            <Text>{content.summary}</Text>
          </View>
        ) : null}

        {content.work.length > 0 ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>EXPERIENCE</Text>
            {content.work.map((entry, index) => (
              <WorkBlock key={index} entry={entry} style={vanguard} />
            ))}
          </View>
        ) : null}

        {content.projects.length > 0 ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>PROJECTS</Text>
            {content.projects.map((project, index) => (
              <View key={index} style={vanguard.entry} wrap={false}>
                <View style={vanguard.entryHeader}>
                  <Text style={vanguard.role}>{project.name}</Text>
                </View>
                {project.description ? <Text>{project.description}</Text> : null}
                <Bullets bullets={project.bullets} style={vanguard} />
              </View>
            ))}
          </View>
        ) : null}

        {content.education.length > 0 ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>EDUCATION</Text>
            {content.education.map((entry, index) => (
              <View key={index} style={vanguard.entryHeader}>
                <Text>
                  <Text style={vanguard.role}>{entry.school}</Text>
                  {entry.degree || entry.field
                    ? ` — ${[entry.degree, entry.field].filter(Boolean).join(", ")}`
                    : ""}
                </Text>
                <Text style={vanguard.dates}>
                  {formatRange(entry.start, entry.end)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {content.certifications.length > 0 ? (
          <View style={vanguard.section}>
            <Text style={vanguard.sectionTitle}>CERTIFICATIONS</Text>
            {content.certifications.map((cert, index) => (
              <Text key={index}>
                {[cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ")}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
