import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockGetUser = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: { getUser: mockGetUser },
  }),
}));

const { verifyWebhook } = await import("@clerk/nextjs/webhooks");
const { POST } = await import("@/app/api/webhooks/clerk/route");
const { profiles } = await import("@/lib/db/schema");

function request() {
  return new NextRequest("http://localhost/api/webhooks/clerk", {
    method: "POST",
  });
}

function mockUserCreatedEvent(id: string) {
  vi.mocked(verifyWebhook).mockResolvedValue({
    type: "user.created",
    data: { id },
  } as Awaited<ReturnType<typeof verifyWebhook>>);
}

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockValues.mockClear();
    mockOnConflictDoNothing.mockClear();
    mockGetUser.mockReset();
  });

  it("creates a profile row on user.created, re-fetching the user from Clerk", async () => {
    mockUserCreatedEvent("user_123");
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_1", emailAddress: "ada@example.com" }],
      primaryEmailAddressId: "email_1",
      firstName: "Ada",
      lastName: "Lovelace",
    });

    const response = await POST(request());

    expect(mockGetUser).toHaveBeenCalledWith("user_123");
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

  it("still creates a profile when the webhook payload itself has no email data (OAuth race)", async () => {
    // Regression test: the raw webhook payload can have an empty
    // email_addresses array for OAuth sign-ups. The handler must rely on
    // a fresh fetch from Clerk instead of the payload, so this should
    // still succeed.
    mockUserCreatedEvent("user_456");
    mockGetUser.mockResolvedValue({
      emailAddresses: [{ id: "email_2", emailAddress: "oauth-user@example.com" }],
      primaryEmailAddressId: "email_2",
      firstName: null,
      lastName: null,
    });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockValues).toHaveBeenCalledWith({
      clerkUserId: "user_456",
      email: "oauth-user@example.com",
      name: null,
    });
  });

  it("skips the insert and logs when Clerk has no email on record", async () => {
    mockUserCreatedEvent("user_789");
    mockGetUser.mockResolvedValue({
      emailAddresses: [],
      primaryEmailAddressId: null,
      firstName: null,
      lastName: null,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("ignores event types other than user.created", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "session.created",
      data: { id: "sess_123" },
    } as unknown as Awaited<ReturnType<typeof verifyWebhook>>);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("bad signature"));

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
