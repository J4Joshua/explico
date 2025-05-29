"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-forai-light/95 backdrop-blur-sm py-3" : "py-5"
      }`}
    >
      <div className="container-padding flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="font-medium">Ekko</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link href="#works" className="text-sm hover:text-forai-gray transition-colors">
            Works
          </Link>
          <Link href="#testimonials" className="text-sm hover:text-forai-gray transition-colors">
            Testimonials
          </Link>
          <Link href="#mission" className="text-sm hover:text-forai-gray transition-colors">
            Mission
          </Link>
          <Link href="#services" className="text-sm hover:text-forai-gray transition-colors">
            Services
          </Link>
          <Link href="#archive" className="text-sm hover:text-forai-gray transition-colors">
            Archive
          </Link>
        </nav>

        {/* Contact Button - Desktop */}
        <Link
          href="#contact"
          className="hidden md:block bg-forai-dark text-white px-4 py-1.5 rounded-full text-sm"
        >
          Contact
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-forai-dark"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-forai-light z-40 pt-20">
          <nav className="flex flex-col space-y-4 p-8">
            <Link
              href="#works"
              className="text-xl hover:text-forai-gray transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Works
            </Link>
            <Link
              href="#testimonials"
              className="text-xl hover:text-forai-gray transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="#mission"
              className="text-xl hover:text-forai-gray transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mission
            </Link>
            <Link
              href="#services"
              className="text-xl hover:text-forai-gray transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="#archive"
              className="text-xl hover:text-forai-gray transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Archive
            </Link>
            <Link
              href="#contact"
              className="bg-forai-dark text-white px-6 py-2 rounded-full text-xl w-fit mt-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
