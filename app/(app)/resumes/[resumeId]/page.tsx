import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ArrowLeft, Mail, MapPin, Phone, SquarePen } from "lucide-react";

import { isPro } from "@/lib/billing/entitlements";
import { db } from "@/lib/db";
import { profiles, resumeVersions, resumes } from "@/lib/db/schema";
import { ExportControl } from "@/components/resumes/export-control";
import { ResumeContent } from "@/lib/validation/resume";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  if (!UUID_RE.test(resumeId)) notFound();

  const { userId } = await auth();
  if (!userId) notFound();

  // Scope by profile so one user can never read another's resume.
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);
  if (!profile) notFound();

  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.profileId, profile.id)))
    .limit(1);
  if (!resume) notFound();

  // The base version. Tailored variants live under their own job and must not
  // silently replace the resume the user thinks of as theirs.
  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(
      and(
        eq(resumeVersions.resumeId, resume.id),
        isNull(resumeVersions.tailoredForJobId),
      ),
    )
    .orderBy(desc(resumeVersions.createdAt))
    .limit(1);

  const parsed = version ? ResumeContent.safeParse(version.content) : null;
  const content = parsed?.success ? parsed.data : null;
  const pro = await isPro(profile.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/resumes"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Resumes
        </Link>
        <div className="flex items-center gap-3">
          {version ? (
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-wider text-on-surface-variant">
              {version.source === "edit" ? "Edited" : `Parsed from ${version.source}`}
              {version.atsScore !== null ? ` · ATS ${version.atsScore}` : ""}
            </span>
          ) : null}
          <Link
            href={`/resumes/${resume.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:border-primary hover:text-primary"
          >
            <SquarePen className="size-4" />
            Edit
          </Link>
          {version ? (
            <ExportControl
              resumeId={resume.id}
              initialTemplateId={resume.templateId}
              isPro={pro}
            />
          ) : null}
        </div>
      </div>

      {content ? (
        <ResumeView content={content} fallbackTitle={resume.title} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <h1 className="font-heading text-2xl font-semibold text-on-background">
            {resume.title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            We saved this resume but couldn&apos;t render its structured
            content yet. The full editor is coming in the next phase.
          </p>
        </div>
      )}
    </div>
  );
}

function ResumeView({
  content,
  fallbackTitle,
}: {
  content: ResumeContent;
  fallbackTitle: string;
}) {
  const { basics } = content;
  const contactItems = [
    basics.email ? { icon: Mail, value: basics.email } : null,
    basics.phone ? { icon: Phone, value: basics.phone } : null,
    basics.location ? { icon: MapPin, value: basics.location } : null,
  ].filter((item) => item !== null);

  return (
    <article className="space-y-10 rounded-xl border border-border bg-surface p-6 md:p-10">
      {/* Header */}
      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="font-heading text-[32px] font-bold leading-tight text-on-background md:text-[40px]">
          {basics.name || fallbackTitle}
        </h1>
        {basics.headline ? (
          <p className="text-lg text-on-surface-variant">{basics.headline}</p>
        ) : null}
        {contactItems.length > 0 ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
            {contactItems.map((item) => (
              <span key={item.value} className="inline-flex items-center gap-1.5">
                <item.icon className="size-4" />
                {item.value}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {content.summary ? (
        <Section title="Summary">
          <p className="text-sm leading-6 text-on-surface-variant">
            {content.summary}
          </p>
        </Section>
      ) : null}

      {content.work.length > 0 ? (
        <Section title="Experience">
          <div className="space-y-6">
            {content.work.map((entry, index) => (
              <div key={`${entry.company}-${index}`} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-on-background">
                    {entry.role}
                    <span className="font-normal text-on-surface-variant">
                      {" · "}
                      {entry.company}
                    </span>
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    {formatRange(entry.start, entry.end)}
                  </span>
                </div>
                {entry.bullets.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-on-surface-variant">
                    {entry.bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {content.education.length > 0 ? (
        <Section title="Education">
          <div className="space-y-4">
            {content.education.map((entry, index) => (
              <div
                key={`${entry.school}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-2"
              >
                <div>
                  <h3 className="text-base font-semibold text-on-background">
                    {entry.school}
                  </h3>
                  {entry.degree || entry.field ? (
                    <p className="text-sm text-on-surface-variant">
                      {[entry.degree, entry.field].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className="text-xs text-on-surface-variant">
                  {formatRange(entry.start, entry.end)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {content.skills.length > 0 ? (
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {content.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-surface-container px-3 py-1 text-xs text-on-surface-variant"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {content.projects.length > 0 ? (
        <Section title="Projects">
          <div className="space-y-4">
            {content.projects.map((entry, index) => (
              <div key={`${entry.name}-${index}`} className="space-y-1">
                <h3 className="text-base font-semibold text-on-background">
                  {entry.name}
                </h3>
                {entry.description ? (
                  <p className="text-sm leading-6 text-on-surface-variant">
                    {entry.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {content.certifications.length > 0 ? (
        <Section title="Certifications">
          <ul className="space-y-1 text-sm text-on-surface-variant">
            {content.certifications.map((entry, index) => (
              <li key={`${entry.name}-${index}`}>
                {entry.name}
                {entry.issuer ? ` · ${entry.issuer}` : ""}
                {entry.year ? ` (${entry.year})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function formatRange(start?: string, end?: string | null): string {
  if (!start && end === undefined) return "";
  const endLabel = end === null ? "Present" : (end ?? "");
  return [start, endLabel].filter(Boolean).join(" – ");
}
