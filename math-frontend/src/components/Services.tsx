"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

const Services = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const paragraph1Ref = useRef<HTMLParagraphElement>(null);
  const paragraph2Ref = useRef<HTMLParagraphElement>(null);
  const heading1Ref = useRef<HTMLHeadingElement>(null);
  const heading2Ref = useRef<HTMLHeadingElement>(null);

  // Animate elements on scroll
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
      { threshold: 0.1, rootMargin: "-50px 0px" }
    );

    if (paragraph1Ref.current) observer.observe(paragraph1Ref.current);
    if (paragraph2Ref.current) observer.observe(paragraph2Ref.current);
    if (heading1Ref.current) observer.observe(heading1Ref.current);
    if (heading2Ref.current) observer.observe(heading2Ref.current);

    return () => {
      if (paragraph1Ref.current) observer.unobserve(paragraph1Ref.current);
      if (paragraph2Ref.current) observer.unobserve(paragraph2Ref.current);
      if (heading1Ref.current) observer.unobserve(heading1Ref.current);
      if (heading2Ref.current) observer.unobserve(heading2Ref.current);
    };
  }, []);

  return (
    <section id="services" ref={sectionRef} className="py-20 container-padding">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-section-title mb-14">Services</h2>

        <p
          ref={paragraph1Ref}
          className="text-xl md:text-2xl leading-relaxed mb-12 opacity-0 translate-y-10 transition-all duration-700"
        >
          Your AI story, visualized. We shape brands that are distinct and memorable. We design interfaces that simplify complexity.
          Where creativity is focused, and every interaction is designed to be pure, orchestrated beauty,
          felt as much as seen.
          Not chasing beauty, but designing the beautiful.
        </p>

        <div className="relative flex justify-end mb-10">
          <p
            ref={paragraph2Ref}
            className="text-lg opacity-0 translate-y-10 transition-all duration-700"
            style={{ transitionDelay: "150ms" }}
          >
            Even
          </p>
        </div>

        <h3
          ref={heading1Ref}
          className="text-4xl md:text-5xl font-medium mb-14 opacity-0 translate-y-10 transition-all duration-700"
          style={{ transitionDelay: "300ms" }}
        >
          Beyond beautiful.
        </h3>

        <div className="mt-20 text-center">
          <h4
            ref={heading2Ref}
            className="text-2xl md:text-3xl font-medium mb-6 opacity-0 translate-y-10 transition-all duration-700"
            style={{ transitionDelay: "450ms" }}
          >
            Let's get started!
          </h4>

          <a
            href="#contact"
            className="inline-block bg-forai-dark text-white px-8 py-3 rounded-full text-lg font-medium transition-transform hover:scale-105 active:scale-98"
          >
            Start a project
          </a>
        </div>
      </div>

      <div className="mt-32 flex justify-center">
        <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] overflow-hidden">
          <Image
            src="https://ext.same-assets.com/3892323758/864244864.webp"
            alt=" ekko"
            fill
            sizes="(max-width: 768px) 280px, 380px"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
};

export default Services;
