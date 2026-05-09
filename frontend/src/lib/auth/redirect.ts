export function sanitizeInternalRedirectPath(
  requestedPath: string | undefined,
  fallbackPath: string
): string {
  if (!requestedPath) {
    return fallbackPath;
  }

  const trimmedPath = requestedPath.trim();
  if (!trimmedPath.startsWith("/")) {
    return fallbackPath;
  }

  if (trimmedPath.startsWith("//") || trimmedPath.startsWith("/\\")) {
    return fallbackPath;
  }

  if (trimmedPath.includes("\n") || trimmedPath.includes("\r")) {
    return fallbackPath;
  }

  return trimmedPath;
}
