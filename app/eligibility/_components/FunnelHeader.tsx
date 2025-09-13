'use client';

import Link from 'next/link';
import { OncoBotLogo } from '@/components/logos/oncobot-logo';

export function FunnelHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <OncoBotLogo 
            size="sm"
            variant="default"
            className="text-foreground"
          />
        </Link>

        <nav className="flex items-center gap-4">
          <a
            href="https://onco.bot/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Privacy
          </a>
          <a
            href="https://onco.bot/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Terms
          </a>
        </nav>
      </div>
    </header>
  );
}