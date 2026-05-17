import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const springUrl = `${process.env.SPRING_API_BASE_URL}/api/priv/media/${path.join("/")}`;

  const accessToken = await getAccessToken();

  let upstream: Response;
  try {
    upstream = await fetch(springUrl, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Media service unreachable" }, { status: 503 });
  }

  if (!upstream.ok) {
    const errorBody = await upstream.text();
    return new NextResponse(errorBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  const blob = await upstream.blob();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type":           upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Length":         upstream.headers.get("Content-Length") ?? "",
      "Cache-Control":          "public, max-age=31536000",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
