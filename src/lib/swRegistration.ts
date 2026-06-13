export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  } else if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'production') {
    // In dev, we might still want to test it
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered (dev): ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed (dev): ', registrationError);
        });
    });
  }
}
