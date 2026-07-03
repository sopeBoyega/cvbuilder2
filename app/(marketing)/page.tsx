"use client";

import {
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Gauge,
  Globe,
  LineChart,
  MailPlus,
  Mic2,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const footerColumns = [
  ["Features", "Pricing", "ATS Checker", "Templates", "Chrome Extension"],
  ["Sign Up", "Sign In", "Privacy Policy", "Terms of Service"],
  ["Help Center", "Contact Us", "Interview Prep", "Resources"],
  ["About Us", "Careers", "Press", "Instagram", "LinkedIn", "Twitter"],
];

const scoreDots = [
  { label: "React", x: "18%", y: "34%", color: "bg-[#5BC06B]" },
  { label: "SQL", x: "70%", y: "23%", color: "bg-[#5BC06B]" },
  { label: "CRM", x: "78%", y: "64%", color: "bg-[#FF8A6B]" },
  { label: "SaaS", x: "32%", y: "76%", color: "bg-[#7C82F0]" },
  { label: "KPIs", x: "50%", y: "14%", color: "bg-[#5BC06B]" },
];

const productTools = [
  { label: "Application tracker", icon: BriefcaseBusiness },
  { label: "Cover-letter generator", icon: MailPlus },
  { label: "Interview prep", icon: Mic2 },
  { label: "Insights and analytics", icon: LineChart },
  { label: "Chrome job capture", icon: Globe },
];

function signUpPath(email: string) {
  const trimmedEmail = email.trim();

  return trimmedEmail ? `/sign-up?email=${encodeURIComponent(trimmedEmail)}` : "/sign-up";
}

function GlassButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`rounded-lg border border-[#242C3D] bg-[#161C2A]/60 px-6 py-3 font-medium text-white backdrop-blur-xl transition-colors hover:bg-[#363941]/70 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`rounded-lg bg-[#5BC06B] px-6 py-3 font-semibold text-[#0D1017] shadow-[0_0_20px_rgba(91,192,107,0.28)] transition-colors hover:bg-[#82E78C] ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ThreadNode({ accent }: { accent: "green" | "coral" | "indigo" }) {
  const colors = {
    green: "border-[#5BC06B]/50 shadow-[0_0_20px_rgba(91,192,107,0.3)]",
    coral: "border-[#FF8A6B]/50 shadow-[0_0_20px_rgba(255,138,107,0.3)]",
    indigo: "border-[#7C82F0]/50 shadow-[0_0_20px_rgba(124,130,240,0.3)]",
  };
  const dotColors = {
    green: "bg-[#5BC06B] shadow-[0_0_10px_#5BC06B]",
    coral: "bg-[#FF8A6B] shadow-[0_0_10px_#FF8A6B]",
    indigo: "bg-[#7C82F0] shadow-[0_0_10px_#7C82F0]",
  };

  return (
    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-[#161C2A] ${colors[accent]}`}>
      <div className={`h-3 w-3 rounded-full ${dotColors[accent]}`} />
    </div>
  );
}

function AtsMatchRing({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative ${
        compact ? "h-[230px] w-[230px]" : "h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]"
      } rounded-full border border-[#242C3D] bg-[#10131A]/90 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_42px_rgba(91,192,107,0.12)]`}
      aria-label="Sample ATS match score improved from 54 to 89"
    >
      <div className="absolute inset-4 rounded-full bg-[conic-gradient(#5BC06B_0_320deg,#242C3D_320deg_360deg)] p-[2px]">
        <div className="relative h-full w-full rounded-full border border-[#242C3D] bg-[#0D1017]">
          <div className="absolute inset-8 rounded-full border border-dashed border-[#363941]" />
          <div className="absolute inset-14 rounded-full border border-[#242C3D]" />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#9BA1A6]">
              ATS Match
            </span>
            <span className="font-mono text-[56px] font-bold leading-none text-white sm:text-[68px]">
              89
            </span>
            <span className="mt-2 font-mono text-sm text-[#5BC06B]">from 54</span>
          </div>
          {scoreDots.map((dot) => (
            <div
              key={dot.label}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
              style={{ left: dot.x, top: dot.y }}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dot.color} shadow-[0_0_16px_currentColor]`} />
              <span className="hidden rounded-full border border-[#242C3D] bg-[#10131A]/95 px-2 py-1 font-mono text-[10px] text-[#E6E8EB] sm:inline">
                {dot.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WindowShell({
  domain = "resumebuilder.com",
  children,
}: {
  domain?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 overflow-hidden rounded-2xl border border-[#242C3D] bg-[#161C2A] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_#242C3D]">
      <div className="flex items-center justify-between border-b border-[#242C3D] bg-[#10131A] p-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
          <div className="h-3 w-3 rounded-full bg-[#242C3D]" />
        </div>
        <div className="rounded border border-[#242C3D] bg-[#161C2A] px-3 py-1 font-mono text-xs text-[#9BA1A6]">
          {domain}
        </div>
        <Plus className="h-4 w-4 text-[#9BA1A6]" />
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </div>
  );
}

function ProgressSteps({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { label: "Job", icon: FileText },
    { label: "Resume", icon: Upload },
    { label: "Score", icon: Gauge },
  ];

  return (
    <div className="relative mx-auto mb-10 flex max-w-sm items-start justify-between">
      <div className="absolute left-8 right-8 top-5 -z-0 h-px bg-[#242C3D]" />
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isDone = index + 1 < active;
        const isActive = index + 1 === active;

        return (
          <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isDone
                  ? "bg-[#5BC06B] text-[#0D1017] shadow-[0_0_20px_rgba(91,192,107,0.3)]"
                  : isActive
                    ? "bg-[#7C82F0] text-white shadow-[0_0_20px_rgba(124,130,240,0.3)]"
                    : "border border-[#242C3D] bg-[#161C2A] text-[#9BA1A6]"
              }`}
            >
              {isDone ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
            </div>
            <span className={`text-xs font-medium ${isActive ? "text-white" : isDone ? "text-[#5BC06B]" : "text-[#9BA1A6]"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MobileFrame({ active, title, subtitle }: { active: 1 | 2 | 3; title: string; subtitle: string }) {
  return (
    <div className="absolute -bottom-10 -right-4 z-20 w-64 rounded-[2.5rem] border-[6px] border-[#1E2330] bg-[#0A0C10] p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_#242C3D] md:-right-12">
      <div className="relative h-full overflow-hidden rounded-[2rem] border border-[#242C3D] bg-[#161C2A]">
        <div className="absolute inset-x-0 top-0 flex h-6 justify-center">
          <div className="h-4 w-24 rounded-b-xl bg-[#1E2330]" />
        </div>
        <div className="h-[500px] overflow-hidden p-4 pt-8">
          <div className="mb-6 text-center">
            <div className="font-heading text-sm font-medium text-white">Resume Builder</div>
            <div className="text-[10px] text-[#9BA1A6]">Tailor before you apply</div>
          </div>
          <div className="relative mb-8 flex items-center justify-between px-2">
            <div className="absolute left-4 right-4 top-1/2 -z-0 h-px bg-[#242C3D]" />
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                  step < active
                    ? "bg-[#5BC06B] text-[#0D1017]"
                    : step === active
                      ? "bg-[#7C82F0] text-white"
                      : "border border-[#242C3D] bg-[#161C2A] text-[#9BA1A6]"
                }`}
              >
                {step < active ? <Check className="h-3 w-3" /> : step === 3 ? <Gauge className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#242C3D] bg-[#10131A] p-4">
            <div className="mb-1 text-xs font-medium text-white">{title}</div>
            <div className="mb-4 text-[10px] text-[#9BA1A6]">{subtitle}</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded bg-[#7C82F0] py-2 text-center text-[10px] font-medium text-white">Use this</div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] py-2 text-center text-[10px] font-medium text-[#E6E8EB]">
                Skip
              </div>
            </div>
            <div className="flex h-20 flex-col justify-center rounded border border-dashed border-[#242C3D] bg-[#161C2A]/60 p-2 text-center text-[9px] text-[#9BA1A6]">
              {active === 3 ? "Score: 89. Matched keywords ready." : "Paste, upload, or capture from Chrome."}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between">
            <div className="px-3 py-2 text-[10px] text-[#9BA1A6]">Previous</div>
            <div className="rounded-md bg-[#7C82F0] px-4 py-2 text-[10px] text-white">Next</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-10 flex w-full justify-center lg:mt-0">
      <AtsMatchRing />
      <div className="absolute -bottom-8 left-1/2 w-[min(360px,92vw)] -translate-x-1/2 rounded-xl border border-[#242C3D] bg-[#161C2A]/90 p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between font-mono text-xs text-[#9BA1A6]">
          <span>Keyword match</span>
          <span className="text-[#5BC06B]">+35 pts</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#242C3D]">
          <div className="h-2 w-[89%] rounded-full bg-[#5BC06B]" />
        </div>
        <p className="mt-3 text-sm text-[#E6E8EB]">
          See matched keywords, missing skills, and rewrite prompts before you submit.
        </p>
      </div>
    </div>
  );
}

function SimplicityPreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={1} />
        <div className="rounded-xl border border-[#242C3D] bg-[#10131A] p-6">
          <h3 className="mb-2 font-heading font-medium text-white">Job Description</h3>
          <p className="mb-6 text-sm text-[#9BA1A6]">
            Paste a job post or capture it with the Chrome extension.
          </p>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <button className="rounded-lg bg-[#7C82F0] py-3 text-sm font-medium text-white">I have one</button>
            <button className="rounded-lg border border-[#242C3D] bg-[#161C2A] py-3 text-sm font-medium text-[#E6E8EB]">
              Browse later
            </button>
          </div>
          <div className="h-32 rounded-lg border border-[#242C3D] bg-[#161C2A] p-4 text-sm text-[#9BA1A6]">
            Paste job description here...
          </div>
        </div>
      </WindowShell>
      <MobileFrame active={1} title="Job Description" subtitle="Capture the role you want." />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-[#5BC06B]/20 blur-[100px]" />
    </div>
  );
}

function CustomizationPreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={2} />
        <div className="rounded-xl border border-[#242C3D] bg-[#10131A] p-6">
          <h3 className="mb-2 font-heading font-medium text-white">Tailored Workspace</h3>
          <p className="mb-6 text-sm text-[#9BA1A6]">
            Keep each resume, cover letter, and follow-up attached to the job.
          </p>
          <div className="grid gap-3">
            {productTools.map((tool) => {
              const ToolIcon = tool.icon;

              return (
                <div key={tool.label} className="flex items-center justify-between rounded-lg border border-[#242C3D] bg-[#161C2A] p-3">
                  <span className="flex items-center gap-3 text-sm">
                    <ToolIcon className="h-4 w-4 text-[#FF8A6B]" />
                    {tool.label}
                  </span>
                  <span className="font-mono text-xs text-[#FF8A6B]">ready</span>
                </div>
              );
            })}
          </div>
        </div>
      </WindowShell>
      <MobileFrame active={2} title="Application Hub" subtitle="Documents and prep in one place." />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 rounded-full bg-[#FF8A6B]/20 blur-[100px]" />
    </div>
  );
}

function IntelligencePreview() {
  return (
    <div className="relative">
      <WindowShell>
        <ProgressSteps active={3} />
        <div className="grid gap-6 rounded-xl border border-[#242C3D] bg-[#10131A] p-6 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="flex justify-center">
            <AtsMatchRing compact />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#7C82F0]/40 bg-[#7C82F0]/10 px-3 py-1 font-mono text-xs text-[#7C82F0]">
              <Bot className="h-3 w-3" />
              ATS optimization
            </div>
            <h3 className="font-heading text-2xl font-semibold text-white">Score before you apply.</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#9BA1A6]">
              Compare your resume to the job description and get AI rewrite prompts for missing keywords, weak bullets, and unclear impact.
            </p>
            <div className="mt-5 grid gap-2 font-mono text-xs text-[#E6E8EB]">
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">Matched: product analytics, SQL, SaaS</div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">Missing: lifecycle campaigns</div>
              <div className="rounded border border-[#242C3D] bg-[#161C2A] p-2">Rewrite priority: experience bullet 2</div>
            </div>
          </div>
        </div>
      </WindowShell>
      <MobileFrame active={3} title="ATS Score" subtitle="Matched and missing terms." />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-[#7C82F0]/20 blur-[100px]" />
    </div>
  );
}

function FeatureSection({
  accent,
  title,
  intro,
  highlight,
  panelTitle,
  panelCopy,
  link,
  statValue,
  statCopy,
  children,
  reverse = false,
}: {
  accent: "green" | "coral" | "indigo";
  title: string;
  intro: string;
  highlight: string;
  panelTitle: string;
  panelCopy: string;
  link: string;
  statValue: string;
  statCopy: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  const accentClasses = {
    green: {
      text: "text-[#5BC06B]",
      border: "border-l-[#5BC06B]",
      line: "bg-[#5BC06B]",
    },
    coral: {
      text: "text-[#FF8A6B]",
      border: "border-l-[#FF8A6B]",
      line: "bg-[#FF8A6B]",
    },
    indigo: {
      text: "text-[#7C82F0]",
      border: "border-l-[#7C82F0]",
      line: "bg-[#7C82F0]",
    },
  };

  return (
    <section className="relative z-10 border-t border-[#242C3D] bg-[#0D1017] px-6 py-24">
      <div className="container relative mx-auto max-w-7xl">
        <div className="absolute -top-[110px] left-0 hidden flex-col items-center md:-left-[24%] md:flex">
          <div className={`h-16 w-px opacity-50 ${accentClasses[accent].line}`} />
          <ThreadNode accent={accent} />
          <div className={`absolute top-full h-full w-px opacity-30 ${accentClasses[accent].line}`} />
        </div>
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div className={`max-w-xl ${reverse ? "order-2 lg:order-1" : ""}`}>
            <h2 className="mb-6 flex items-center gap-4 font-heading text-3xl font-bold text-white md:text-5xl">
              <span className="md:hidden">
                <ThreadNode accent={accent} />
              </span>
              {title}
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-[#9BA1A6] md:text-2xl">
              {intro} <span className={`${accentClasses[accent].text} font-medium`}>{highlight}</span>
            </p>
            <div className={`rounded-2xl border border-[#242C3D] border-l-4 bg-[#161C2A]/60 p-6 backdrop-blur-xl ${accentClasses[accent].border}`}>
              <p className="mb-4 text-sm leading-relaxed text-[#E6E8EB]">
                <strong className={accentClasses[accent].text}>{panelTitle}</strong> {panelCopy}
              </p>
              <button className="group flex items-center gap-2 font-mono text-sm text-[#E6E8EB] hover:text-white">
                <span className="border-b border-[#242C3D] pb-0.5 transition-colors group-hover:border-[#E6E8EB]">
                  {link}
                </span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="mt-12 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#242C3D]">
                <span className="font-mono text-xs text-[#9BA1A6]">STAT</span>
              </div>
              <div>
                <div className="mb-1 font-mono text-xs uppercase tracking-wider text-[#9BA1A6]">Product signal</div>
                <div className={`mb-2 font-heading text-4xl font-bold ${accentClasses[accent].text}`}>{statValue}</div>
                <p className="text-sm text-[#9BA1A6]">{statCopy}</p>
              </div>
            </div>
          </div>
          <div className={`relative ${reverse ? "order-1 lg:order-2" : ""}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0D1017] font-sans text-[#E6E8EB] selection:bg-[#5BC06B] selection:text-[#0D1017]">
      <nav className="fixed top-0 z-50 w-full border-b border-[#242C3D] bg-[#161C2A]/60 py-4 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#7C82F0]/30 bg-[#7C82F0]/20 text-[#7C82F0]">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">Resume Builder</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="text-[#9BA1A6] transition-colors hover:text-white" onClick={() => router.push("/login")}>
              Sign in
            </button>
            <GlassButton className="px-4 py-2" onClick={() => router.push(signUpPath(email))}>
              Sign up
            </GlassButton>
          </div>
        </div>
      </nav>

      <main className="relative">
        <div className="pointer-events-none absolute inset-0 z-0 h-[120vh] opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(124,130,240,0.22),transparent_28%),radial-gradient(circle_at_72%_22%,rgba(91,192,107,0.16),transparent_24%),radial-gradient(circle_at_58%_70%,rgba(255,138,107,0.12),transparent_26%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#E6E8EB_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1017]/80 to-[#0D1017]" />
        </div>

        <div className="pointer-events-none absolute bottom-0 left-8 top-32 z-0 hidden w-px bg-gradient-to-b from-[#7C82F0] via-[#5BC06B] to-[#FF8A6B] opacity-30 md:left-1/4 md:block" />

        <section className="relative z-10 overflow-hidden px-6 pb-24 pt-40 md:pb-32 md:pt-52">
          <div className="container mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#7C82F0]/30 bg-[#161C2A]/60 px-4 py-2 shadow-[0_0_20px_rgba(124,130,240,0.12)] backdrop-blur-xl">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7C82F0] shadow-[0_0_10px_rgba(124,130,240,0.8)]">
                  <Sparkles className="h-3 w-3 text-[#0D1017]" />
                </div>
                <span className="font-mono text-xs text-[#9BA1A6]">
                  Resume Builder Hub: tailor each application before you apply
                </span>
              </div>
              <h1 className="mb-6 font-heading text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                Beat the bots.
                <br />
                <span className="bg-gradient-to-r from-white to-[#9BA1A6] bg-clip-text text-transparent">
                  Land the interview.
                </span>
              </h1>
              <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[#9BA1A6] md:text-xl">
                Tailor your resume to a specific job description, optimize it for ATS filters, and see your match score before you apply. Free to start, with Pro tools when you need them.
              </p>
              <div className="flex max-w-2xl flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    className="w-full rounded-lg border border-[#242C3D] bg-[#161C2A] px-4 py-3 text-white outline-none transition-all placeholder:text-[#9BA1A6] focus:border-[#5BC06B] focus:ring-1 focus:ring-[#5BC06B]"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    type="email"
                    value={email}
                  />
                </div>
                <PrimaryButton className="whitespace-nowrap" onClick={() => router.push("/tools/ats-checker")}>
                  Check ATS score - free
                </PrimaryButton>
                <GlassButton className="flex items-center justify-center gap-2 whitespace-nowrap" onClick={() => router.push(signUpPath(email))}>
                  Create account
                  <ChevronRight className="h-4 w-4" />
                </GlassButton>
              </div>
            </div>
            <HeroPreview />
          </div>
        </section>

        <div className="h-20 md:h-32" />

        <FeatureSection
          accent="green"
          highlight="so you can move from job post to action plan in minutes."
          intro="Capture the role, upload your resume, and get focused next steps"
          link="Check your resume's ATS score"
          panelCopy="turns a job description into a simple workflow: capture the role, upload your resume, review keyword gaps, and apply with confidence."
          panelTitle="Resume Builder"
          statCopy="from job description to resume feedback, match score, and ready-to-apply next actions."
          statValue="3 steps"
          title="Simplicity"
        >
          <SimplicityPreview />
        </FeatureSection>

        <FeatureSection
          accent="coral"
          highlight="while keeping every document tied to the application it belongs to."
          intro="Generate tailored resumes, cover letters, prep notes, and follow-ups"
          link="Start tailoring a resume"
          panelCopy="helps you manage the full application story: tracker, cover-letter generator, interview prep, insights, analytics, and Chrome extension capture."
          panelTitle="More than a resume builder,"
          reverse
          statCopy="tracker, tailoring, cover letters, interview prep, and analytics connected around each job."
          statValue="5 tools"
          title="Customization"
        >
          <CustomizationPreview />
        </FeatureSection>

        <FeatureSection
          accent="indigo"
          highlight="not just formatting suggestions."
          intro="AI ATS optimization compares your resume against the real job description"
          link="Run the free ATS checker"
          panelCopy="finds missing keywords, weak bullets, and unclear impact, then gives role-specific rewrite prompts before you submit."
          panelTitle="Resume Builder's AI"
          statCopy="sample match score after adding relevant keywords and clarifying role-specific achievements."
          statValue="89"
          title="Intelligence"
        >
          <IntelligencePreview />
        </FeatureSection>

        <section className="relative z-10 overflow-hidden border-t border-[#242C3D] bg-[#0D1017] px-6 py-24">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(#E6E8EB_1px,transparent_1px)] [background-size:30px_30px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(91,192,107,0.16),transparent_24%),radial-gradient(circle_at_45%_60%,rgba(124,130,240,0.14),transparent_28%)]" />
          <div className="container relative mx-auto max-w-4xl text-center">
            <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Check your resume before the ATS does.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9BA1A6]">
              Start with a free ATS score, then upgrade to Pro when you want deeper tailoring, tracking, and interview prep.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <PrimaryButton onClick={() => router.push("/tools/ats-checker")}>Check ATS score - free</PrimaryButton>
              <GlassButton onClick={() => router.push(signUpPath(email))}>Create Pro-ready account</GlassButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#242C3D] bg-[#0D1017] px-6 py-16">
        <div className="container mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(4,0.7fr)]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#7C82F0]/30 bg-[#7C82F0]/20 text-[#7C82F0]">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">Resume Builder</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#9BA1A6]">
              Tailor resumes, improve ATS match, track applications, generate cover letters, and prepare for interviews.
            </p>
            <button className="mt-5 rounded-lg border border-[#242C3D] bg-[#161C2A]/60 px-4 py-2 text-sm transition-colors hover:bg-[#363941]/70">
              Subscribe
            </button>
          </div>
          {footerColumns.map((items) => (
            <ul key={items[0]} className="space-y-3 text-sm text-[#9BA1A6]">
              {items.map((item) => (
                <li key={item}>
                  <button className="text-left transition-colors hover:text-white">{item}</button>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="container mx-auto mt-12 flex max-w-7xl flex-wrap gap-4 border-t border-[#242C3D] pt-6 font-mono text-xs text-[#9BA1A6]">
          <p>(c) 2026 Resume Builder, Inc.</p>
          <p>Terms</p>
          <p>Privacy (Updated 01/2026)</p>
        </div>
      </footer>
    </div>
  );
}
