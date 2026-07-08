import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(),
}));

const { verifyWebhook } = await import("@clerk/nextjs/webhooks");
const { POST } = await import("@/app/api/webhooks/clerk/route");
const { profiles } = await import("@/lib/db/schema");

function request() {
  return new NextRequest("http://localhost/api/webhooks/clerk", {
    method: "POST",
  });
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockValues.mockClear();
    mockOnConflictDoNothing.mockClear();
  });

  it("creates a profile row on user.created", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.created",
      data: {
        id: "user_123",
        email_addresses: [
          { id: "email_1", email_address: "ada@example.com" },
        ],
        primary_email_address_id: "email_1",
        first_name: "Ada",
        last_name: "Lovelace",
      },
    } as Awaited<ReturnType<typeof verifyWebhook>>);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(profiles);
    expect(mockValues).toHaveBeenCalledWith({
      clerkUserId: "user_123",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
    expect(mockOnConflictDoNothing).toHaveBeenCalledWith({
      target: profiles.clerkUserId,
    });
  });

  it("ignores event types other than user.created", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "session.created",
      data: { id: "sess_123" },
    } as unknown as Awaited<ReturnType<typeof verifyWebhook>>);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("bad signature"));

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
