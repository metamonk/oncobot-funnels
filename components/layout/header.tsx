'use client';

import Link from 'next/link';
import { OncoBotLogo } from '@/components/logos/oncobot-logo';

export interface HeaderProps {
  showNav?: boolean;
  variant?: 'default' | 'minimal';
}

export function Header({
  showNav = true,
  variant = 'default'
}: HeaderProps = {}) {
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

        {showNav && (
          <nav className="flex items-center gap-4">
            {variant === 'default' && (
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            )}
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
        )}
      </div>
    </header>
  );
}