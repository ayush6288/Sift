export function userDisplayName(user) {
  const fullName = user?.user_metadata?.full_name?.trim();
  if (fullName) return fullName;

  const email = user?.email?.trim();
  if (!email) return 'Sift user';

  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
