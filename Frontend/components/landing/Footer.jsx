'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { FadeIn, SlideInLeft, Float } from './AnimationWrapper';

export default function Footer() {
  const footerLinks = [
    {
      title: 'PLATFORM',
      links: [
        { label: 'Module Builder', href: '/modules' },
        { label: 'Assignment Features', href: '/features' },
        { label: 'AI Feedback', href: '/ai-feedback' },
        { label: 'Analytics', href: '/analytics' }
      ]
    },
    {
      title: 'FEATURES',
      links: [
        { label: 'AI Analytics', href: '/features#analytics' },
        { label: 'Test Creation', href: '/features#tests' },
        { label: 'Grading', href: '/features#grading' },
        { label: 'Student Dashboard', href: '/features#students' },
        { label: 'Mastery Learning', href: '/features#mastery' },
      ]
    },
    {
      title: 'RESOURCES',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Documentation', href: '/docs' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' }
      ]
    },
    {
      title: 'COMPANY',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Branding', href: '/branding' },
        { label: 'Affiliates', href: '/affiliates' },
        { label: 'Reviews', href: '/reviews' }
      ]
    },
    {
      title: 'SUPPORT',
      links: [
        { label: 'Contact Us', href: '/contact' },
        { label: 'Help center', href: '/help' },
        { label: 'Getting started', href: '/start' },
        { label: 'Hire a Pro', href: '/pros' }
      ]
    }
  ];

  return (
    <footer className="w-full bg-white">
      {/* 1. Curved Top CTA Section */}
      <div className="relative bg-[#a8d3e6] pt-24 pb-32 overflow-hidden">
        {/* The Arc - This creates the smooth curve at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[120px] bg-white rounded-[100%] transition-all" />

        {/* Decorative Floating Shapes (Inspired by image) */}
        <div className="absolute top-40 left-[10%] w-12 h-12 bg-white/60 rounded-full" />
        <div className="absolute top-60 left-[15%] w-10 h-10 bg-[#1a212c] -rotate-12 rounded-sm" />
        <div className="absolute bottom-20 left-[20%] w-14 h-14 bg-white/40 rotate-12" />
        <div className="absolute top-32 right-[15%] w-12 h-12 bg-[#1a212c] rotate-[30deg] clip-triangle" 
             style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute bottom-16 right-[10%] w-16 h-16 bg-[#1a212c] rounded-full opacity-90" />
        <div className="absolute top-1/2 right-[5%] w-8 h-8 bg-white/50 rounded-sm rotate-45" />

        {/* The White CTA Card */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <FadeIn delay={0.2}>
            <Float duration={5}>
              <div className="bg-white rounded-[40px] p-12 md:p-20 text-center shadow-sm">
                <h2 className="text-3xl md:text-5xl font-bold text-[#1a212c] tracking-tighter leading-[1.1] mb-4">
                  Business is much simpler when<br />everything is in one place
                </h2>
                <p className="text-lg text-slate-600 mb-10">
                  See for yourself. Try it free for 30 days.
                </p>
                <Button
                  asChild
                  className="bg-[#1a212c] hover:bg-slate-800 text-white px-10 py-7 text-lg font-bold rounded-xl h-auto"
                >
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </div>
            </Float>
          </FadeIn>
        </div>
      </div>

      {/* 2. Main Footer Links */}
      <div className="bg-[#a8d3e6] pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
            {/* Brand Logo */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-2xl font-black text-[#1a212c]">
                ai pilot
              </Link>
            </div>

            {/* Dynamic Link Columns */}
            {footerLinks.map((column) => (
              <div key={column.title} className="col-span-1">
                <h3 className="text-[11px] font-black tracking-widest text-[#1a212c] uppercase mb-6">
                  {column.title}
                </h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[#1a212c] hover:underline text-sm font-medium opacity-80"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 3. Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#1a212c]/10">
            <div className="flex gap-6 mb-6 md:mb-0">
              <Twitter className="w-5 h-5 text-[#1a212c] cursor-pointer hover:opacity-70" />
              <Facebook className="w-5 h-5 text-[#1a212c] cursor-pointer hover:opacity-70" />
              <Instagram className="w-5 h-5 text-[#1a212c] cursor-pointer hover:opacity-70" />
              <Youtube className="w-5 h-5 text-[#1a212c] cursor-pointer hover:opacity-70" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 text-sm font-medium text-[#1a212c]/70">
              <span>AI Pilot, Inc. © {new Date().getFullYear()}</span>
              <div className="flex gap-6">
                <Link href="/terms" className="hover:text-[#1a212c]">Terms</Link>
                <Link href="/privacy" className="hover:text-[#1a212c]">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}