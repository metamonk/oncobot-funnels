declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any>; revenue?: { currency: string; amount: number } }) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      setPersonProperties: (properties: Record<string, any>) => void;
      identify?: (distinctId: string, properties?: Record<string, any>) => void;
      reset?: () => void;
    };
  }
}

export {};