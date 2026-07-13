import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  Send,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { profiles, resumes } from "@/lib/db/schema";
import { cn, timeAgo } from "@/lib/utils";

const CARD_HOVER =
  "transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[inset_0_0_20px_rgba(91,192,107,0.05),0_10px_30px_-10px_rgba(0,0,0,0.5)]";

function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? user?.username ?? "there";

  // Pull the mirrored profile + this user's resumes. A brand-new account may
  // have no profile row yet (webhook still in flight) — treat that as empty.
  let resumeList: (typeof resumes.$inferSelect)[] = [];
  if (user) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, user.id))
      .limit(1);

    if (profile) {
      resumeList = await db
        .select()
        .from(resumes)
        .where(eq(resumes.profileId, profile.id))
        .orderBy(desc(resumes.updatedAt))
        .limit(5);
    }
  }

  const hasResumes = resumeList.length > 0;

  const stats = [
    { label: "Avg ATS Score", value: "—", icon: Star, accent: "text-indigo-hi" },
    { label: "Active Apps", value: "0", icon: Send, accent: "text-blue" },
    {
      label: "Resumes",
      value: String(resumeList.length),
      icon: FileText,
      accent: "text-primary",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 md:p-8">
      {/* Greeting & CTA */}
      <section
        className="relative overflow-hidden rounded-xl border border-border bg-surface-container p-6 md:p-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-[40px] font-bold leading-[1.15] tracking-tight text-on-background md:text-[56px]">
              {greetingFor()}, {firstName}
            </h2>
            <p className="mt-1 text-base leading-6 text-on-surface-variant">
              {hasResumes
                ? "Pick up where you left off, or tailor a resume to a new job."
                : "Let's build your first tailored resume to get started."}
            </p>
          </div>
          <Link
            href={hasResumes ? "/tailor" : "/onboarding"}
            className="group flex w-fit items-center gap-4 rounded-xl bg-primary px-6 py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] hover:shadow-primary/20 active:scale-95"
          >
            <Sparkles className="size-5" />
            <span>{hasResumes ? "Tailor to a job" : "Create your first resume"}</span>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1 rounded-xl border border-border bg-surface p-6",
              CARD_HOVER,
            )}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium uppercase leading-[1.15] tracking-wider text-on-surface-variant">
                {stat.label}
              </span>
              <stat.icon className={cn("size-5", stat.accent)} />
            </div>
            <span className={cn("font-mono text-[32px]", stat.accent)}>
              {stat.value}
            </span>
          </div>
        ))}
      </section>

      {/* Recent resumes */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-[30px] font-semibold leading-[1.2] text-on-background">
            Your Resumes
          </h3>
          {hasResumes ? (
            <Link
              href="/resumes"
              className="text-sm font-bold text-primary hover:underline"
            >
              View All
            </Link>
          ) : null}
        </div>

        {hasResumes ? (
          <div className="space-y-4">
            {resumeList.map((resume) => (
              <Link
                key={resume.id}
                href={`/resumes/${resume.id}`}
                className={cn(
                  "group flex items-center justify-between gap-6 rounded-xl border border-border bg-surface p-6",
                  CARD_HOVER,
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-surface-raised text-on-surface-variant">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-[22px] font-semibold leading-[1.3] text-on-background transition-colors group-hover:text-primary">
                      {resume.title}
                    </h4>
                    <p className="text-xs leading-[1.15] text-on-surface-variant">
                      Updated {timeAgo(resume.updatedAt)}
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyResumesState />
        )}
      </section>
    </div>
  );
}

function EmptyResumesState() {
  const options = [
    {
      href: "/onboarding",
      icon: UploadCloud,
      title: "Import or upload",
      detail: "Bring in your LinkedIn profile or an existing CV, and we'll parse it.",
    },
    {
      href: "/onboarding",
      icon: FilePlus2,
      title: "Start from scratch",
      detail: "Build a resume section by section, guided the whole way.",
    },
  ];

  return (
    <EmptyState
      icon={FileText}
      title="No resumes yet"
      description="Your resumes and their ATS scores will show up here. Create your first one to get started."
    >
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
        {options.map((option) => (
          <Link
            key={option.title}
            href={option.href}
            className={cn(
              "group flex flex-col gap-3 rounded-xl border border-border bg-surface-container p-5",
              CARD_HOVER,
            )}
          >
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface-raised text-primary">
              <option.icon className="size-5" />
            </div>
            <div>
              <h5 className="text-base font-semibold text-on-background transition-colors group-hover:text-primary">
                {option.title}
              </h5>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                {option.detail}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </EmptyState>
  );
}
