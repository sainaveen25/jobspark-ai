interface MfaMetadata {
  mfa_required?: boolean;
  mfa_setup_complete?: boolean;
}

export function requiresMfaSetup(user: { user_metadata?: Record<string, unknown> | null } | null | undefined) {
  if (!user) {
    return false;
  }

  const metadata = (user.user_metadata ?? {}) as MfaMetadata;
  return metadata.mfa_required === true && metadata.mfa_setup_complete !== true;
}
