export interface WorkspaceContext {
  workspaceId: string;
  permissions: string[];
  /** The API key's creator user ID (from Better Auth) */
  creatorUserId: string;
  /** The API key's creator display name */
  creatorName: string;
  /** The API key's creator email */
  creatorEmail: string;
  /** The API key's human-readable name */
  apiKeyName: string;
}
