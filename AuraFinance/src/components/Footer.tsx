'use client';

import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Image
              src="/images/suitee.jpg"
              alt="Aura Finance Logo"
              width={120}
              height={48}
              className="object-contain mb-4"
            />
          </div>

          <div>
            <h4 className="font-bold mb-4">Products</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">AuraBank</a></li>
              <li><a href="#" className="hover:text-white">AuraVest</a></li>
              <li><a href="#" className="hover:text-white">AuraWallet</a></li>
              <li><a href="#" className="hover:text-white">AuraAI</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/about" className="hover:text-white">About Us</a></li>
              <li><a href="/blog" className="hover:text-white">Blog</a></li>
              <li><a href="/contact" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>© 2025 Aura Finance. All rights reserved. FDIC Insured. Member SIPC.</p>
        </div>
      </div>
    </footer>
  );
}
