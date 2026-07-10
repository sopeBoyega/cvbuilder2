"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs/legacy";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";

import { Logo } from "@/components/shell/logo";
import { PasswordField } from "@/components/auth/password-field";
import { BRAND } from "@/lib/brand";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function requestCode() {
    if (!isLoaded) return;
    await signIn.create({
      identifier: email,
      strategy: "reset_password_email_code",
    });
  }

  async function handleRequest(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await requestCode();
      setStep("reset");
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        "Couldn't find an account with that email.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!isLoaded) return;
    setError(null);
    try {
      await requestCode();
    } catch {
      setError("Couldn't resend the code. Please try again.");
    }
  }

  async function handleReset(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (attempt.status === "needs_new_password") {
        const completed = await signIn.resetPassword({
          password: newPassword,
        });

        if (completed.status === "complete") {
          await setActive({ session: completed.createdSessionId });
          router.push("/dashboard");
          return;
        }
      }

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.push("/dashboard");
        return;
      }

      setError("That code didn't work. Please try again.");
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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4 text-on-background md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center overflow-hidden">
        <div className="absolute -top-[400px] size-[800px] rounded-full bg-primary-container/5 blur-[120px]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-0 hidden h-[50vh] w-px -translate-x-1/2 opacity-30 md:block"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #5bc06b 50%, transparent 100%)",
          boxShadow: "0 0 8px #5bc06b",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-[16px] border border-border bg-surface p-6 shadow-2xl md:p-10">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Logo className="size-6" />
            <span className="font-heading text-[26px] font-bold leading-[1.15] tracking-tight text-primary md:text-[30px]">
              {BRAND.name}
            </span>
          </div>

          {step === "request" ? (
            <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500">
              <div className="mb-6 text-center">
                <h1 className="mb-2 font-heading text-[26px] font-semibold leading-[1.2] text-on-surface md:text-[30px]">
                  Reset Password
                </h1>
                <p className="text-sm leading-5 text-on-surface-variant">
                  Enter your email address and we&apos;ll send you a code to
                  reset your password.
                </p>
              </div>

              <form className="flex flex-col gap-6" onSubmit={handleRequest}>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full rounded-[8px] border border-border bg-surface-container-lowest px-3 py-3 text-sm leading-5 text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-all focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50"
                  />
                </div>

                {error ? (
                  <p role="alert" className="text-sm leading-5 text-destructive">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary-container px-6 py-[14px] text-base font-medium leading-6 text-on-primary-container transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Sending…" : "Send reset code"}
                  <ArrowRight className="size-5" />
                </button>

                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-1 text-sm leading-5 text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  <ArrowLeft className="size-4" />
                  Back to log in
                </Link>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-primary-container/20 bg-primary-container/10 shadow-[0_0_20px_rgba(91,192,107,0.15)]">
                  <KeyRound className="size-8 text-primary-container" />
                </div>
                <h2 className="mb-2 font-heading text-[26px] font-semibold leading-[1.2] text-on-surface md:text-[30px]">
                  Check your email
                </h2>
                <p className="px-2 text-sm leading-5 text-on-surface-variant">
                  Enter the code we sent to{" "}
                  <span className="font-medium text-on-surface">{email}</span>{" "}
                  and choose a new password.
                </p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleReset}>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="code"
                    className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
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
                    className="w-full rounded-[8px] border border-border bg-surface-container-lowest px-3 py-3 text-center font-mono text-lg tracking-[0.3em] text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-all focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/50"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="new-password"
                    className="text-xs font-medium uppercase leading-[1.15] tracking-[0.06em] text-on-surface-variant"
                  >
                    New Password
                  </label>
                  <PasswordField
                    id="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    inputClassName="border-border bg-surface-container-lowest"
                  />
                </div>

                {error ? (
                  <p role="alert" className="text-sm leading-5 text-destructive">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-primary-container px-6 py-[14px] text-base font-medium leading-6 text-on-primary-container transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Resetting…" : "Reset password"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-[1.15] text-on-surface-variant">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  className="ml-1 font-medium text-primary transition-colors hover:text-primary-fixed focus:outline-none focus:underline"
                >
                  Click to resend
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
