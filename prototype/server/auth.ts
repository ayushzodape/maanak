import { randomUUID } from 'node:crypto';

export const SESSION_COOKIE = 'maanak_session';

export interface AuthenticatedUser {
  readonly id: string;
  readonly role: 'INSPECTOR';
}

export interface AuthConfig {
  readonly username: string;
  readonly password: string;
}

export interface SessionStore {
  create(): { token: string; user: AuthenticatedUser };
  get(token: string | undefined): AuthenticatedUser | undefined;
  delete(token: string | undefined): void;
}

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, AuthenticatedUser>();

  constructor(private readonly userId = 'configured-inspector') {}

  create() {
    const token = `sess_${randomUUID()}`;
    const user: AuthenticatedUser = { id: this.userId, role: 'INSPECTOR' };
    this.sessions.set(token, user);
    return { token, user };
  }

  get(token: string | undefined): AuthenticatedUser | undefined {
    return token ? this.sessions.get(token) : undefined;
  }

  delete(token: string | undefined): void {
    if (token) this.sessions.delete(token);
  }
}

export function configuredAuthFromEnvironment(): AuthConfig | undefined {
  const username = process.env.MAANAK_AUTH_USERNAME;
  const password = process.env.MAANAK_AUTH_PASSWORD;
  return username && password ? { username, password } : undefined;
}

export function readSessionToken(cookieHeader: string | undefined): string | undefined {
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(`${SESSION_COOKIE}=`.length);
}
