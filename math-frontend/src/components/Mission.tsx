"use client";

import { useRef, useEffect } from "react";

const Mission = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const firstItemRef = useRef<HTMLParagraphElement>(null);
  const secondItemRef = useRef<HTMLParagraphElement>(null);
  const thirdItemRef = useRef<HTMLParagraphElement>(null);

  // Animate mission statements on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        }
      },
      { threshold: 0.2, rootMargin: "-50px 0px" }
    );

    if (firstItemRef.current) observer.observe(firstItemRef.current);
    if (secondItemRef.current) observer.observe(secondItemRef.current);
    if (thirdItemRef.current) observer.observe(thirdItemRef.current);

    return () => {
      if (firstItemRef.current) observer.unobserve(firstItemRef.current);
      if (secondItemRef.current) observer.unobserve(secondItemRef.current);
      if (thirdItemRef.current) observer.unobserve(thirdItemRef.current);
    };
  }, []);

  return (
    <section id="mission" ref={sectionRef} className="py-20 container-padding">
      <h2 className="text-section-title mb-16">Mission</h2>

      <div className="max-w-2xl mx-auto">
        <p
          ref={firstItemRef}
          className="text-xl md:text-2xl font-medium mb-10 opacity-0 translate-y-10 transition-all duration-700"
        >
          Make it the best version of what it can be.
        </p>

        <p
          ref={secondItemRef}
          className="text-xl md:text-2xl font-medium mb-10 opacity-0 translate-y-10 transition-all duration-700"
          style={{ transitionDelay: "150ms" }}
        >
          Only the kind of work were proud to sign.
        </p>

        <p
          ref={thirdItemRef}
          className="text-xl md:text-2xl font-medium opacity-0 translate-y-10 transition-all duration-700"
          style={{ transitionDelay: "300ms" }}
        >
          No shortcuts. No soulless, throwaway fluff.
        </p>
      </div>
    </section>
  );
};

export default Mission;
