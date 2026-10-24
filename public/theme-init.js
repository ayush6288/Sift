try {
  const storedTheme = localStorage.getItem('sift-theme');
  document.documentElement.classList.toggle(
    'dark',
    storedTheme !== 'light',
  );
} catch {}
