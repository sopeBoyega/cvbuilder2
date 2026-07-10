"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import { ArrowRight, Lock, Mail } from "lucide-react";

import { GoogleIcon, LinkedInIcon } from "@/components/auth/oauth-icons";
import { PasswordField } from "@/components/auth/password-field";
import { Logo } from "@/components/shell/logo";
import { BRAND } from "@/lib/brand";

type OAuthStrategy = "oauth_google" | "oauth_linkedin_oidc";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthPending, setOauthPending] = useState<OAuthStrategy | null>(null);

  // Clerk runs in single-session mode: attempting a second sign-in while a
  // session is live never returns "complete". Send them straight to the app.
  useEffect(() => {
    if (authLoaded && isSignedIn) router.replace("/dashboard");
  }, [authLoaded, isSignedIn, router]);

  async function handleOAuth(strategy: OAuthStrategy) {
    if (!isLoaded) return;
    setError(null);
    setOauthPending(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch {
      setError("Something went wrong starting that sign-in. Try again.");
      setOauthPending(null);
    }
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
        strategy: "password",
      });

      switch (result.status) {
        case "complete":
          await setActive({ session: result.createdSessionId });
          router.push("/dashboard");
          break;
        case "needs_new_password":
          router.push("/reset-password");
          break;
        case "needs_second_factor":
          setError(
            "This account uses two-factor authentication, which isn't supported yet.",
          );
          break;
        case "needs_first_factor":
        case "needs_client_trust":
          setError("Additional verification is required to finish signing in.");
          break;
        default:
          setError("We couldn't complete sign-in. Please try again.");
      }
    } catch (err) {
      const clerkError = (
        err as { errors?: { code?: string; message?: string }[] }
      )?.errors?.[0];

      // Already signed in (single-session mode) — not an error worth showing.
      if (clerkError?.code === "session_exists") {
        router.replace("/dashboard");
        return;
      }

      setError(
        clerkError?.message ??
          "Couldn't sign in with those details. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || oauthPending !== null;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12 text-on-background md:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(36, 44, 61, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(36, 44, 61, 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <section className="relative z-10 flex w-full max-w-[1440px] flex-col items-center justify-center">
        <header className="mb-10 text-center">
          <h1 className="flex items-center justify-center gap-3 font-heading text-[30px] font-bold leading-[1.15] tracking-tight text-primary-fixed md:text-[40px]">
            <Logo className="size-8 text-primary" />
            {BRAND.name}
          </h1>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">
            Initialize your professional trajectory.
          </p>
        </header>

        <div
          className="relative w-full max-w-md overflow-hidden rounded-[12px] border border-border bg-surface p-6 md:p-10"
          style={{ boxShadow: "0 0 60px -15px rgba(91, 192, 107, 0.15)" }}
        >
          <div className="absolute left-0 top-0 h-px w-full bg-linear-to-r from-transparent via-primary-container/50 to-transparent" />

          <div className="mb-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleOAuth("oauth_google")}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] border border-border bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon className="size-5 transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold leading-[1.3]">
                Continue with Google
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleOAuth("oauth_linkedin_oidc")}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] border border-border bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LinkedInIcon className="size-5 text-[#0A66C2] transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold leading-[1.3]">
                Continue with LinkedIn
              </span>
            </button>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant">
              or sign in with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="astronaut@example.com"
                  className="w-full rounded-[8px] border border-border bg-surface-container-lowest py-3 pl-10 pr-3 text-sm leading-5 text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-all focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                >
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-primary transition-colors hover:text-primary-fixed"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordField
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="size-5" />}
                inputClassName="border-border bg-surface-container-lowest py-3 pl-10 pr-11 placeholder:text-on-surface-variant/30 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50"
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
              className="group relative mt-1 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[8px] bg-primary-container px-4 py-3 text-lg font-semibold leading-[1.3] text-on-primary-container shadow-[0_0_20px_rgba(91,192,107,0.15)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="relative z-10">
                {isSubmitting ? "Signing in…" : "Sign In"}
              </span>
              <ArrowRight className="relative z-10 size-5 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 z-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm leading-5 text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="ml-2 text-lg font-semibold leading-[1.3] text-primary transition-colors hover:text-primary-fixed"
          >
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
