import { navigationItems } from './navigation';

describe('dashboard administration navigation', () => {
  it('groups administrator tools beneath Administration', () => {
    const administration = navigationItems.find(item => item.id === 'administration');

    expect(administration?.children?.map(item => [item.label, item.to])).toEqual([
      ['User Management', '/dashboard/administration'],
      ['System Monitoring', '/dashboard/system'],
      ['Device Inventory', '/dashboard/administration/devices'],
      ['Device Dropdown Lists', '/dashboard/administration/device-lists'],
      ['SLA Configuration', '/dashboard/administration/sla'],
      ['Audit Log', '/dashboard/audit'],
    ]);
    expect(navigationItems.some(item => item.id === 'system')).toBe(false);
    expect(navigationItems.some(item => item.id === 'sla-administration')).toBe(false);
    expect(navigationItems.some(item => item.id === 'audit')).toBe(false);
  });
});
