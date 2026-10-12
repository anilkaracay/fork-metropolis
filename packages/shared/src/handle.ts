import { z } from "zod";

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
// Route segments, roles and names that would read as the product or its providers.
export const RESERVED_HANDLES: readonly string[] = [
  "about",
  "admin",
  "administrator",
  "anonymous",
  "api",
  "dev",
  "envio",
  "everyone",
  "explore",
  "feed",
  "fork",
  "forktrades",
  "help",
  "moderation",
  "moderator",
  "monad",
  "new",
  "null",
  "official",
  "privacy",
  "privy",
  "profile",
  "root",
  "security",
  "settings",
  "staff",
  "support",
  "system",
  "team",
  "terms",
  "test",
  "undefined",
  "unknown",
];
// The form every account starts with. Nobody can claim someone else's starting handle.
export const isGeneratedHandle = (value: string) =>
  /^u_[0-9a-f]{12}$/.test(value);

export const normalizeHandle = (value: string) => value.trim().toLowerCase();

/** Returns what the user should fix, or null when the handle can be claimed. */
export function handleProblem(value: string): string | null {
  const handle = normalizeHandle(value);
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX)
    return `Use ${HANDLE_MIN} to ${HANDLE_MAX} characters.`;
  if (!/^[a-z0-9_]+$/.test(handle))
    return "Use lowercase letters, numbers and underscores.";
  if (RESERVED_HANDLES.includes(handle) || isGeneratedHandle(handle))
    return "That handle is reserved. Choose another.";
  return null;
}

export const handleSchema = z
  .string()
  .transform(normalizeHandle)
  .superRefine((handle, context) => {
    const problem = handleProblem(handle);
    if (problem) context.addIssue({ code: "custom", message: problem });
  });
