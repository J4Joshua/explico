"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

// Define testimonials data
const testimonials = [
  {
    id: "03",
    text: "Beyond just delivering great design work, they were true collaborators who took the time to understand our community and mission. The end result perfectly captures AG2's spirit - it's technical yet approachable, playful yet professional, and most importantly, it resonates strongly with our developer community.",
    author: "Qingyun Wu",
    role: "Founder of AG2 (formerly AutoGen)",
    company: "AG2",
    link: "https://ag2.ai/"
  },
  {
    id: "04",
    text: "You guys were tremendous! You did a great job in such little time. Really appreciate. Looking forward to more.",
    author: "Daryl Xu",
    role: "Co-Founder of B3.Fun",
    company: "B3.Fun",
    link: "https://b3.fun/"
  },
  {
    id: "05",
    text: "ForAI exceeded our expectations, crafting a product-centric, detail-oriented landing page with remarkable speed and precision. Their dedication to their craft resonated across social media, generating significant buzz and engagement for our website.",
    author: "Max von Wolff",
    role: "CEO AT OZONE",
    company: "OZONE",
    link: "https://ozone.pro/"
  }
];

// Define client logos
const clientLogos = [
  { name: "Cisco", logo: "https://ext.same-assets.com/3892323758/4126285995.svg" },
  { name: "Webex", logo: "https://ext.same-assets.com/3892323758/103172166.svg" },
  { name: "AG2", logo: "/ag2-logo.svg" },
  { name: "Layer", logo: "/layer-logo.svg" },
  { name: "B3", logo: "/b3-logo.svg" },
  { name: "IO.NET", logo: "/io-logo.svg" },
  { name: "Instant", logo: "/instant-logo.svg" },
  { name: "Doconomy", logo: "/doconomy-logo.svg" },
  { name: "Screenloop", logo: "/screenloop-logo.svg" },
  { name: "Framer", logo: "/framer-logo.svg" },
  { name: "Ozone", logo: "/ozone-logo.svg" },
  { name: "Brainbase", logo: "/brainbase-logo.svg" }
];

const Testimonials = () => {
  const sectionRef = useRef<HTMLElement>(null);

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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".testimonial-card");
      const logos = sectionRef.current.querySelectorAll(".logo-item");

      for (const card of Array.from(cards)) {
        observer.observe(card);
      }

      for (const logo of Array.from(logos)) {
        observer.observe(logo);
      }
    }

    return () => {
      if (sectionRef.current) {
        const cards = sectionRef.current.querySelectorAll(".testimonial-card");
        const logos = sectionRef.current.querySelectorAll(".logo-item");

        for (const card of Array.from(cards)) {
          observer.unobserve(card);
        }

        for (const logo of Array.from(logos)) {
          observer.unobserve(logo);
        }
      }
    };
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="py-20 container-padding">
      <h2 className="text-section-title mb-12">Testimonials</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className="testimonial-card flex flex-col opacity-0 translate-y-10 transition-all duration-700"
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <p className="text-sm mb-6">{testimonial.text}</p>
            <div className="mt-auto">
              <p className="font-medium">{testimonial.author}</p>
              <p className="text-sm text-forai-gray">
                {testimonial.role}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="logo-grid">
        {clientLogos.map((client, index) => (
          <div
            key={client.name}
            className="logo-item opacity-0 translate-y-10 transition-all duration-700"
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            {client.logo.endsWith('.svg') ? (
              <div className="w-16 h-8 relative flex items-center justify-center">
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={64}
                  height={32}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="text-xs font-medium text-forai-gray">{client.name}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-2xl mx-auto text-center">
        <p className="text-lg">
          We make the work we believe in.<br />
          Work were proud to have made.<br />
          Work worth being known for.
        </p>
      </div>
    </section>
  );
};

export default Testimonials;
