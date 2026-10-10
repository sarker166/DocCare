import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ViewportManager() {
  const location = useLocation();

  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      document.head.appendChild(metaViewport);
    }

    if (location.pathname === '/') {
      // Home page: Fully responsive mobile view
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    } else {
      // All other pages: Force Desktop view (1280px)
      metaViewport.setAttribute('content', 'width=1280');
    }
  }, [location.pathname]);

  return null;
}
