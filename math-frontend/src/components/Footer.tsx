"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer id="contact" className="py-10 container-padding border-t border-forai-lightgray">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="font-medium mb-2">Ekko</div>
          <p className="text-sm text-forai-gray max-w-xs">
            math math math
          </p>
        </div>

        <div className="text-sm">
          <a
            href="mailto:hello@forai.design"
            className="text-forai-gray hover:text-forai-dark transition-colors"
          >
            ekko@ekko.sg
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
