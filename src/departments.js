export const DEPARTMENTS = [
  { id: 'tennis', label: '🎾 ტენისი' },
  { id: 'equestrian', label: '🐴 საჯინიბო' },
  { id: 'quad', label: '🏍️ კვადრო / ბაგი' },
  { id: 'padel', label: '🏓 პადელი' }
];

const departmentIds = DEPARTMENTS.map(department => department.id);

export function parseDepartmentAccess(value, role) {
  if (role === 'super_admin' || !value || value === 'all') return [...departmentIds];
  const entries = value.split(',').map(entry => entry.trim());
  return departmentIds.filter(id => entries.includes(id));
}

export function serializeDepartmentAccess(selected) {
  const valid = departmentIds.filter(id => selected.includes(id));
  return valid.length === departmentIds.length ? 'all' : valid.join(',');
}

export function departmentAccessLabel(value, role) {
  const selected = parseDepartmentAccess(value, role);
  if (selected.length === departmentIds.length) return '🌐 ყველა';
  return DEPARTMENTS.filter(department => selected.includes(department.id))
    .map(department => department.label).join(', ') || 'წვდომა არ არის';
}
