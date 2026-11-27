const COLORS = ['2C6BED', '42B72A', 'F0902F', '9b59b6', '16a085'];

export const colorFor = (id) => COLORS[Math.abs(Number(id) || 0) % COLORS.length];

export function avatarUrl(name, bg, size = 128) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&bold=true&size=${size}`;
}

// The ONE place that decides which picture a person gets: their uploaded
// profile photo if they have one, otherwise a coloured letter avatar.
// Works with API users ({id, name, avatar}) and the logged-in user
// ({id, first_name, last_name, avatar_url}).
export function avatarOf(user, size = 128) {
  if (!user) return avatarUrl('User', COLORS[0], size);
  const photo = user.avatar || user.avatar_url;
  if (photo) return photo;
  const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
  return avatarUrl(name, colorFor(user.id), size);
}

export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}