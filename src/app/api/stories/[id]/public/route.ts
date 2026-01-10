import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

// GET /api/stories/[id]/public
export async function GET(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  let params = context.params;
  if (params instanceof Promise) {
    params = await params;
  }
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    // Recupera solo storie attive e pubbliche del profilo
    const stories = await queryAll(
      `SELECT
        s.id,
        s.profile_id,
        p.username,
        p.profile_image_url,
        p.is_verified,
        s.media_url,
        s.media_type,
        s.duration_seconds,
        s.views_count,
        s.created_at,
        s.expires_at
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.profile_id = ?
        AND s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
        AND p.is_private = 0
      ORDER BY s.created_at ASC`,
      [id]
    );
    return NextResponse.json({ stories });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
