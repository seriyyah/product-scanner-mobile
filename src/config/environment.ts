/**
 * Which backend the app talks to.
 *
 * `local` is the Docker stack on the development machine; `prod` is the Oracle
 * instance real users reach. Selected with EXPO_PUBLIC_ENV, and overridable with
 * EXPO_PUBLIC_API_BASE_URL for a tunnel or a one-off host.
 */
export const ENVIRONMENTS = {
  local: 'http://localhost:8300',
  prod: 'https://130-61-214-140.sslip.io',
} as const;

export type EnvName = keyof typeof ENVIRONMENTS;

interface Selection {
  env?: string | undefined;
  explicitUrl?: string | undefined;
}

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

/**
 * Defaults to production when nothing says otherwise. A release build pointing at
 * localhost fails for every user while looking perfectly fine on the machine that
 * built it, so the safe default is the one that fails loudly rather than quietly.
 */
export const resolveApiBaseUrl = ({ env, explicitUrl }: Selection = {}): string => {
  const override = explicitUrl?.trim();
  if (override) return trimTrailingSlash(override);

  const name = env?.trim() as EnvName | undefined;
  return name && name in ENVIRONMENTS ? ENVIRONMENTS[name] : ENVIRONMENTS.prod;
};

/** The URL this build will actually use. */
export const API_BASE_URL = resolveApiBaseUrl({
  env: process.env.EXPO_PUBLIC_ENV,
  explicitUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
});
