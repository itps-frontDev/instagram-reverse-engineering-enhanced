export function getMediaUrl(blobNameOrUrl: string | null | undefined): string | null {
  if (!blobNameOrUrl || blobNameOrUrl.trim() === '') return null;
  if (blobNameOrUrl.startsWith('/') || blobNameOrUrl.startsWith('http')) return blobNameOrUrl;
  return `/api/media/${blobNameOrUrl}`;
}
