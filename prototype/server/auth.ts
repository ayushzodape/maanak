import { randomUUID } from 'node:crypto';

export const SESSION_COOKIE = 'maanak_session';

export type UserRole = 'INSPECTOR' | 'SUPERVISOR_ADMIN';

export type UserPermission =
  | 'SCANS_CREATE'
  | 'SCANS_READ'
  | 'REPORTS_EXPORT'
  | 'RULES_MANAGE'
  | 'METRICS_VIEW_DISTRICT'
  | 'AUDIT_LOGS_VIEW';

export const ROLE_PERMISSIONS: Record<UserRole, readonly UserPermission[]> = {
  INSPECTOR: ['SCANS_CREATE', 'SCANS_READ', 'REPORTS_EXPORT'],
  SUPERVISOR_ADMIN: [
    'SCANS_CREATE',
    'SCANS_READ',
    'REPORTS_EXPORT',
    'RULES_MANAGE',
    'METRICS_VIEW_DISTRICT',
    'AUDIT_LOGS_VIEW',
  ],
};

export interface AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly role: UserRole;
  readonly permissions: readonly UserPermission[];
}

export interface UserAccountConfig {
  readonly id?: string;
  readonly username: string;
  readonly password: string;
  readonly role: UserRole;
}

export interface AuthConfig {
  readonly username?: string;
  readonly password?: string;
  readonly role?: UserRole;
  readonly users?: readonly UserAccountConfig[];
}

export interface SessionStore {
  create(user?: AuthenticatedUser): { token: string; user: AuthenticatedUser };
  get(token: string | undefined): AuthenticatedUser | undefined;
  delete(token: string | undefined): void;
}

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, AuthenticatedUser>();

  constructor(private readonly defaultUserId = 'configured-inspector') {}

  create(user?: AuthenticatedUser) {
    const token = `sess_${randomUUID()}`;
    const sessionUser: AuthenticatedUser = user ?? {
      id: this.defaultUserId,
      username: 'inspector',
      role: 'INSPECTOR',
      permissions: ROLE_PERMISSIONS.INSPECTOR,
    };
    this.sessions.set(token, sessionUser);
    return { token, user: sessionUser };
  }

  get(token: string | undefined): AuthenticatedUser | undefined {
    return token ? this.sessions.get(token) : undefined;
  }

  delete(token: string | undefined): void {
    if (token) this.sessions.delete(token);
  }
}

export function configuredAuthFromEnvironment(): AuthConfig | undefined {
  const inspectorUsername = process.env.MAANAK_AUTH_USERNAME;
  const inspectorPassword = process.env.MAANAK_AUTH_PASSWORD;
  const supervisorUsername = process.env.MAANAK_ADMIN_USERNAME || 'supervisor';
  const supervisorPassword = process.env.MAANAK_ADMIN_PASSWORD || 'admin123';

  if (!inspectorUsername || !inspectorPassword) return undefined;

  return {
    username: inspectorUsername,
    password: inspectorPassword,
    role: 'INSPECTOR',
    users: [
      {
        id: 'inspector-1',
        username: inspectorUsername,
        password: inspectorPassword,
        role: 'INSPECTOR',
      },
      {
        id: 'supervisor-1',
        username: supervisorUsername,
        password: supervisorPassword,
        role: 'SUPERVISOR_ADMIN',
      },
    ],
  };
}

export function readSessionToken(cookieHeader: string | undefined): string | undefined {
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(`${SESSION_COOKIE}=`.length);
}
