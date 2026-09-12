export function resolveLoginRedirect(
  pathname: string,
  search: string,
  defaultLoginRedirectPath?: string
): { pathname: string; search: string } {
  const safeDefault =
    typeof defaultLoginRedirectPath === 'string' &&
    defaultLoginRedirectPath.startsWith('/') &&
    !defaultLoginRedirectPath.startsWith('//')
      ? defaultLoginRedirectPath
      : undefined;

  if (pathname === '/' && search === '' && safeDefault) {
    return { pathname: safeDefault, search: '' };
  }

  return { pathname, search };
}
