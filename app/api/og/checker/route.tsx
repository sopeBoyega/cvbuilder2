import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { BRAND } from "@/lib/brand";

/**
 * `GET /api/og/checker?s=72&m=9&x=4`
 *
 * The share-card image: a guest's keyword match score, rendered as the social
 * preview for shared checker links. Carries only the three numbers from the
 * URL — never resume or job content.
 */

/** Clamped integer param, or the fallback when absent/garbage. */
function intParam(
  request: NextRequest,
  name: string,
  max: number,
  fallback: number | null,
): number | null {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null) return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) return fallback;
  return Math.min(Math.max(value, 0), max);
}

export async function GET(request: NextRequest) {
  const score = intParam(request, "s", 100, null);
  const matched = intParam(request, "m", 999, null);
  const missing = intParam(request, "x", 999, null);

  const accent = score !== null && score >= 70 ? "#5BC06B" : "#FF8A6B";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#0D1017",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(124,130,240,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(91,192,107,0.18), transparent 40%)",
          color: "#E6E8EB",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              border: "2px solid rgba(91,192,107,0.5)",
              backgroundColor: "rgba(91,192,107,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5BC06B",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            CV
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            {BRAND.name}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 280,
              height: 280,
              borderRadius: 9999,
              border: `10px solid ${accent}`,
              backgroundColor: "#10131A",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color: accent,
              }}
            >
              {score ?? "?"}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#9BA1A6" }}>
              / 100
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.15,
              }}
            >
              Keyword match score
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {matched !== null ? (
                <div
                  style={{
                    display: "flex",
                    padding: "10px 24px",
                    borderRadius: 9999,
                    border: "2px solid rgba(91,192,107,0.4)",
                    backgroundColor: "rgba(91,192,107,0.12)",
                    color: "#5BC06B",
                    fontSize: 28,
                  }}
                >
                  {matched} matched
                </div>
              ) : null}
              {missing !== null ? (
                <div
                  style={{
                    display: "flex",
                    padding: "10px 24px",
                    borderRadius: 9999,
                    border: "2px solid rgba(255,138,107,0.4)",
                    backgroundColor: "rgba(255,138,107,0.12)",
                    color: "#FF8A6B",
                    fontSize: 28,
                  }}
                >
                  {missing} missing
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            color: "#9BA1A6",
          }}
        >
          <div style={{ display: "flex" }}>
            Check your resume against any job. Free, nothing stored.
          </div>
          <div style={{ display: "flex", color: "#5BC06B", fontWeight: 700 }}>
            Try the checker →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
