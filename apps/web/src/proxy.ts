import { NextResponse, type NextRequest } from "next/server";

// Reject before rendering: streamed notFound() responses can have status 200.
// This guards only the opt-in development proof, never authenticates a user.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FORK_TEST_MODE ||
    !host ||
    !["localhost", "127.0.0.1"].includes(host) ||
    !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)
  )
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "This route does not exist.",
          recovery: "Return to Feed.",
        },
      },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  return NextResponse.next();
}

export const config = { matcher: "/dev/privy" };
