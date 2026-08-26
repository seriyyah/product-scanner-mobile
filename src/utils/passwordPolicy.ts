/**
 * The password policy, mirrored from auth-service.
 *
 * The register form previously checked only the minimum length, so a password
 * failing the character rules passed client validation and was rejected by the
 * server — which, at the time, answered with a 500 and no explanation.
 *
 * Keeping the rules in one place lets the form both block submission and show the
 * user exactly which requirements are still outstanding.
 *
 * Backend equivalent: UserCredentials.validate_password_strength in
 * services/auth-service/src/domain/models.py
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>';

export interface PasswordRule {
  /** Stable key, used for the i18n string and as a React key. */
  readonly id: 'length' | 'uppercase' | 'lowercase' | 'digit' | 'special';
  readonly met: boolean;
}

export const checkPassword = (password: string): PasswordRule[] => {
  const value = password ?? '';
  return [
    { id: 'length', met: value.length >= PASSWORD_MIN_LENGTH },
    { id: 'uppercase', met: /[A-Z]/.test(value) },
    { id: 'lowercase', met: /[a-z]/.test(value) },
    { id: 'digit', met: /[0-9]/.test(value) },
    {
      id: 'special',
      met: value.split('').some((char) => SPECIAL_CHARACTERS.includes(char)),
    },
  ];
};

export const isPasswordAcceptable = (password: string): boolean =>
  (password ?? '').length <= PASSWORD_MAX_LENGTH &&
  checkPassword(password).every((rule) => rule.met);

/** The rules still outstanding, for a single summary message. */
export const unmetRules = (password: string): PasswordRule['id'][] =>
  checkPassword(password).filter((rule) => !rule.met).map((rule) => rule.id);
