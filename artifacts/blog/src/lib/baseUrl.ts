export const hostname = process.env.HOSTNAME || "commissionkit.co";
export const baseUrl = `https://${hostname}`;

/** Only prefixes with baseUrl if the URL is not already absolute. */
export function makeAbsolute(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
}
