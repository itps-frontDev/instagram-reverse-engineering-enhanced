import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const commentId = parseInt(id);
    if (!commentId) {
      return NextResponse.json({ error: 'Invalid comment id' }, { status: 400 });
    }
    // Verifica che il commento esista e sia dell'utente
    const comment = await queryOne<{ id: number; profile_id: number; post_id: number; parent_id: number | null }>(
      'SELECT id, profile_id, post_id, parent_id FROM comments WHERE id = ? AND deleted_at IS NULL',
      [commentId]
    );
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    if (comment.profile_id !== currentProfile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Soft delete
    await execute('UPDATE comments SET deleted_at = datetime(\'now\', \'localtime\') WHERE id = ?', [commentId]);
    // Decrementa il contatore solo se top-level
    if (!comment.parent_id) {
      await execute('UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?', [comment.post_id]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
