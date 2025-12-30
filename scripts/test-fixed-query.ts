import { queryAll } from '../src/lib/db';

(async () => {
  const profileId = 4;
  const sql = `
    SELECT
      s.id,
      s.profile_id,
      p.username,
      p.profile_image_url,
      s.media_url,
      s.media_type,
      s.duration_seconds,
      s.views_count,
      s.created_at,
      s.expires_at
    FROM stories s
    JOIN profiles p ON p.id = s.profile_id
    WHERE s.profile_id IN (
      SELECT following_profile_id FROM follows 
      WHERE follower_profile_id = ? 
        AND status = 'accepted'
    )
      AND s.expires_at > datetime('now')
    ORDER BY s.created_at DESC
    LIMIT 200
  `;

  const rows = await queryAll(sql, [profileId]);
  console.log('Stories count:', rows.length);
  console.log(JSON.stringify(rows, null, 2));
})();
