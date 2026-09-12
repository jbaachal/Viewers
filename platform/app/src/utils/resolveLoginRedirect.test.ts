import { resolveLoginRedirect } from './resolveLoginRedirect';

describe('resolveLoginRedirect', () => {
  it('uses the configured landing page for a login started at the bare root', () => {
    expect(resolveLoginRedirect('/', '', '/dashboard')).toEqual({
      pathname: '/dashboard',
      search: '',
    });
  });

  it('preserves direct viewer and dashboard links', () => {
    expect(resolveLoginRedirect('/viewer', '?StudyInstanceUIDs=1.2.3', '/dashboard')).toEqual({
      pathname: '/viewer',
      search: '?StudyInstanceUIDs=1.2.3',
    });
  });

  it('preserves root links carrying study-list query parameters', () => {
    expect(resolveLoginRedirect('/', '?patientName=DOE', '/dashboard')).toEqual({
      pathname: '/',
      search: '?patientName=DOE',
    });
  });

  it('rejects protocol-relative redirect values', () => {
    expect(resolveLoginRedirect('/', '', '//untrusted.example')).toEqual({
      pathname: '/',
      search: '',
    });
  });
});
