export function emailPrefix(email) {
  if (!email || typeof email !== 'string') return null;
  return email.split('@')[0];
}

export function displayName(user) {
  if (!user) return 'User';
  if (typeof user === 'string') return user;
  if (user.displayName) return user.displayName;
  if (user.name) return user.name;
  if (user.email) return emailPrefix(user.email);
  if (user._id) return String(user._id).slice(0, 6);
  return 'User';
}

export function initials(user) {
  const name = displayName(user) || 'User';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
}

export default displayName;
