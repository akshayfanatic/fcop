export const toPort = (value: string | undefined, fallback: number) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

export const toLogLevel = (value: string | undefined) => {
  const logLevel = value?.toLowerCase();

  if (logLevel === 'all') {
    return 'trace';
  }

  if (logLevel === 'info' || logLevel === 'error') {
    return logLevel;
  }

  return 'info';
};

export const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return fallback;
};

export const toCookieSameSite = (value: string | undefined, fallback: 'lax' | 'strict' | 'none') => {
  const sameSite = value?.trim().toLowerCase();

  if (sameSite === 'lax' || sameSite === 'strict' || sameSite === 'none') {
    return sameSite;
  }

  return fallback;
};

const getHostname = (origin: string) => {
  try {
    return new URL(origin).hostname;
  } catch {
    return undefined;
  }
};

const getSslipParentDomain = (origin: string) => {
  const hostname = getHostname(origin);
  const match = hostname?.match(/^(?:[^.]+\.)?((?:\d{1,3}\.){4}sslip\.io)$/);

  return match?.[1];
};

export const toSharedSslipCookieDomain = (frontendOrigin: string, authOrigin: string) => {
  const frontendParentDomain = getSslipParentDomain(frontendOrigin);
  const authParentDomain = getSslipParentDomain(authOrigin);

  if (!frontendParentDomain || frontendParentDomain !== authParentDomain) {
    return undefined;
  }

  return `.${authParentDomain}`;
};

export const toOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
};

export const toOrigins = (value: string | undefined, fallback: string[]) => {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .map(toOrigin)
    .filter(Boolean);

  return origins?.length ? origins : fallback;
};
