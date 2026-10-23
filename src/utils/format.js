export function formatListTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const today = startOfDay(now);
  const day = startOfDay(date);

  if (day === today) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (today - day === 24 * 60 * 60 * 1000) {
    return 'Yesterday';
  }

  if (today - day < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const startOfDay = (value) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const today = startOfDay(now);
  const day = startOfDay(date);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (day === today) {
    return `Today at ${time}`;
  }

  if (today - day === 24 * 60 * 60 * 1000) {
    return `Yesterday at ${time}`;
  }

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} at ${time}`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
