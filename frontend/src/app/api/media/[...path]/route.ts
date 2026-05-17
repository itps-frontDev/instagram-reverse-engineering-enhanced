import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const springUrl = `${process.env.SPRING_API_BASE_URL}/api/priv/media/${path.join("/")}`;

  const accessToken = await getAccessToken();

  const fetchOptions = {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store" as const,
  };

  let upstream: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      upstream = await fetch(springUrl, {
        ...fetchOptions,
        signal: AbortSignal.timeout(15_000),
      });
      break;
    } catch {
      if (attempt === 2) {
        return NextResponse.json({ error: "Media service unreachable" }, { status: 503 });
      }
    }
  }
  upstream = upstream!;

  if (!upstream.ok) {
    const errorBody = await upstream.text();
    return new NextResponse(errorBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  const headers: Record<string, string> = {
    "Cache-Control":          "public, max-age=31536000",
    "X-Content-Type-Options": "nosniff",
  };
  const contentType = upstream.headers.get("Content-Type");
  if (contentType) headers["Content-Type"] = contentType;
  const contentLength = upstream.headers.get("Content-Length");
  if (contentLength) headers["Content-Length"] = contentLength;

  return new NextResponse(upstream.body, { status: 200, headers });
}
