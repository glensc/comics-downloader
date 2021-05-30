const env = process.env;

export const IMAP_USERNAME = String(env["IMAP_USERNAME"]);
export const IMAP_PASSWORD = String(env["IMAP_PASSWORD"]);
export const IMAP_HOSTNAME = env["IMAP_HOSTNAME"] || "imap.gmail.com";
export const IMAP_PORT = Number(env["IMAP_PORT"] || 993);
