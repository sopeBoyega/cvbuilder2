"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs/legacy";

import { Logo } from "@/components/shell/logo";
import { GoogleIcon, LinkedInIcon } from "@/components/auth/oauth-icons";
import { PasswordField } from "@/components/auth/password-field";

type OAuthStrategy = "oauth_google" | "oauth_linkedin_oidc";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthPending, setOauthPending] = useState<OAuthStrategy | null>(null);

  const busy = isSubmitting || oauthPending !== null;

  async function handleOAuth(strategy: OAuthStrategy) {
    if (!isLoaded) return;
    setError(null);
    setOauthPending(strategy);
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch {
      setError("Something went wrong starting that sign-up. Try again.");
      setOauthPending(null);
    }
  }

  async function handleCreate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp.create({ emailAddress: email, password });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/onboarding");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "Couldn't create your account. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/onboarding");
      } else {
        setError("That code didn't work. Please try again.");
      }
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "That code didn't work. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center overflow-x-auto bg-background p-4 text-on-surface selection:bg-primary-container/30 selection:text-primary-fixed md:p-8">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden border border-border bg-surface shadow-2xl md:min-h-[900px] md:flex-row xl:max-w-[1440px]">
        {/* Left panel: brand & value prop */}
        <section
          className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-[#0D1017] p-10 md:flex"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, rgba(255,255,255,0.05) 1px, transparent 1px), radial-gradient(circle at 85% 30%, rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
            backgroundSize: "100px 100px",
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-[var(--border-strong)] opacity-30" />
          <div
            className="pointer-events-none absolute left-1/4 top-1/3 size-3 -translate-x-[5px] rounded-full bg-primary"
            style={{ boxShadow: "0 0 15px 2px rgba(91,192,107,0.3)" }}
          />
          <div className="pointer-events-none absolute left-1/4 top-2/3 size-2 -translate-x-[3px] rounded-full bg-indigo opacity-70" />

          <div className="flex items-center gap-2">
            <Logo className="size-8" />
            <h1 className="font-heading text-[40px] font-bold leading-[1.15] tracking-tight text-primary">
              CVBuilder
            </h1>
          </div>

          <div className="relative z-10">
            <p className="mb-2 font-mono text-sm font-medium uppercase leading-[1.4] tracking-widest text-primary/70">
              System Ready
            </p>
            <h2 className="mb-3 font-heading text-[56px] font-bold leading-[1.15] tracking-tight text-on-surface">
              Tailor your resume to any job.
            </h2>
            <p className="max-w-md text-[22px] font-semibold leading-[1.3] text-on-surface-variant">
              Beat the bots. Land the interview. Precision tools for your
              career trajectory.
            </p>
          </div>
        </section>

        {/* Right panel: sign-up form */}
        <section className="relative z-10 flex w-full flex-col justify-center bg-surface p-4 md:w-1/2 md:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 flex items-center justify-center gap-2 md:hidden">
              <Logo className="size-7" />
              <h1 className="font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-primary">
                CVBuilder
              </h1>
            </div>

            {step === "form" ? (
              <div className="animate-in fade-in-0 duration-500">
                <div className="mb-6 text-center md:text-left">
                  <h2 className="mb-2 font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
                    Create your account
                  </h2>
                  <p className="text-sm leading-5 text-on-surface-variant">
                    Initialize your professional profile.
                  </p>
                </div>

                <div className="mb-6 flex flex-col gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleOAuth("oauth_linkedin_oidc")}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-[8px] border border-primary/40 bg-primary/10 px-4 py-3 text-on-surface transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                    <LinkedInIcon className="size-5 text-[#0A66C2]" />
                    <span className="relative z-10 text-base font-medium leading-6">
                      Continue with LinkedIn
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleOAuth("oauth_google")}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] border border-border bg-surface-raised px-4 py-3 text-on-surface transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <GoogleIcon className="size-5" />
                    <span className="text-base font-medium leading-6">
                      Continue with Google
                    </span>
                  </button>
                </div>

                <div className="mb-6 flex items-center">
                  <div className="h-px flex-grow bg-border" />
                  <span className="mx-4 shrink-0 font-mono text-xs font-medium uppercase leading-[1.15] tracking-widest text-on-surface-variant">
                    or
                  </span>
                  <div className="h-px flex-grow bg-border" />
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleCreate}>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@example.com"
                      className="w-full rounded-[8px] border border-border bg-surface-raised px-4 py-3 text-sm leading-5 text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/60"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                    >
                      Password
                    </label>
                    <PasswordField
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  {error ? (
                    <p role="alert" className="text-sm leading-5 text-destructive">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busy}
                    className="group relative mt-1 cursor-pointer overflow-hidden rounded-[8px] bg-primary px-6 py-3 text-lg font-semibold leading-[1.3] text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative z-10">
                      {isSubmitting ? "Creating account…" : "Create account"}
                    </span>
                    <div className="absolute inset-0 origin-left scale-x-0 bg-white/20 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  </button>
                </form>

                <p className="mt-6 text-center text-sm leading-5 text-on-surface-variant">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary-fixed hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                <p className="mx-auto mt-10 max-w-xs text-center text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant/60">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="underline transition-colors hover:text-on-surface">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline transition-colors hover:text-on-surface">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
                <div className="mb-6 text-center md:text-left">
                  <h2 className="mb-2 font-heading text-[30px] font-semibold leading-[1.2] text-on-surface">
                    Check your email
                  </h2>
                  <p className="text-sm leading-5 text-on-surface-variant">
                    We sent a verification code to{" "}
                    <span className="font-medium text-on-surface">{email}</span>.
                  </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleVerify}>
                  <div>
                    <label
                      htmlFor="code"
                      className="mb-1 block text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                    >
                      Verification Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-[8px] border border-border bg-surface-raised px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/60"
                    />
                  </div>

                  {error ? (
                    <p role="alert" className="text-sm leading-5 text-destructive">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={busy}
                    className="group relative mt-1 cursor-pointer overflow-hidden rounded-[8px] bg-primary px-6 py-3 text-lg font-semibold leading-[1.3] text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative z-10">
                      {isSubmitting ? "Verifying…" : "Verify email"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="cursor-pointer text-center text-sm leading-5 text-on-surface-variant transition-colors hover:text-on-surface"
                  >
                    Back
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
