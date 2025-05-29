"use client";

import { useEffect } from "react";

export function ClientBody({ children }: { children: React.ReactNode }) {
  // Add smooth scrolling behavior
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (
        link?.href &&
        link.hash &&
        link.pathname === window.location.pathname &&
        link.hash.length > 1
      ) {
        e.preventDefault();
        const id = link.hash.slice(1);
        const element = document.getElementById(id);

        if (element) {
          window.scrollTo({
            behavior: 'smooth',
            top: element.getBoundingClientRect().top + window.scrollY - 100,
          });
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return <>{children}</>;
}
