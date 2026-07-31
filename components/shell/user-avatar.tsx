import { cn } from "@/lib/utils";

/**
 * Same four accent hexes as `app/globals.css` (green/indigo/coral/blue), with
 * a text color picked per swatch for contrast — paired manually since these
 * accents don't have dedicated on-* tokens the way `--primary` does.
 */
const PALETTE = [
  { bg: "#82E78C", fg: "#0D1017" }, // green-hi
  { bg: "#949AFF", fg: "#0D1017" }, // indigo-hi
  { bg: "#FFA38D", fg: "#0D1017" }, // coral-hi
  { bg: "#2563EB", fg: "#F5F7FA" }, // blue — darker, needs light text
] as const;

/** Deterministic, not cryptographic — just needs to scatter evenly by seed. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initialsFrom(
  name: string | null | undefined,
  username: string | null | undefined,
  email: string | null | undefined,
): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (username?.trim()) return username.trim().slice(0, 2).toUpperCase();
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return "?";
}

/**
 * A user's avatar: their real uploaded photo when Clerk has one, otherwise a
 * generated initials badge. Seeded by `seed` (pass the stable Clerk user id,
 * not the display name) so the color a user gets never changes across
 * sessions or devices, even though it looks arbitrary at a glance.
 *
 * Deliberately not a Clerk `<UserButton>`: this needs to render inline in the
 * sidebar's own layout (avatar + username + our sign-out action), not inside
 * Clerk's popover menu.
 */
export function UserAvatar({
  seed,
  photoUrl,
  name,
  username,
  email,
  size = 36,
  className,
}: {
  seed: string;
  photoUrl?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Clerk-hosted URL, decorative avatar sized via style
      <img
        src={photoUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const { bg, fg } = PALETTE[hashSeed(seed) % PALETTE.length];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-bold",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: fg,
        fontSize: size * 0.4,
      }}
    >
      {initialsFrom(name, username, email)}
    </div>
  );
}
