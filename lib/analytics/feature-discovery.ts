/**
 * Feature Discovery Module
 * Tracks which features users have discovered and used
 */

export type FeatureId = 
  | 'chat'
  | 'health-profile'
  | 'clinical-trials'
  | 'web-search'
  | 'academic-search'
  | 'memory'
  | 'custom-instructions'
  | 'voice-input'
  | 'image-upload'
  | 'code-execution'
  | 'maps'
  | 'weather'
  | 'stocks'
  | 'crypto'
  | 'movies'
  | 'reddit'
  | 'twitter'
  | 'youtube'
  | 'flight-tracker'
  | 'currency-converter';

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  category: 'core' | 'search' | 'tools' | 'personalization' | 'input';
}

export const FEATURES: Record<FeatureId, Feature> = {
  'chat': {
    id: 'chat',
    name: 'Chat',
    description: 'Basic chat functionality',
    category: 'core'
  },
  'health-profile': {
    id: 'health-profile',
    name: 'Health Profile',
    description: 'Personal health information management',
    category: 'personalization'
  },
  'clinical-trials': {
    id: 'clinical-trials',
    name: 'Clinical Trials',
    description: 'Search and match clinical trials',
    category: 'core'
  },
  'web-search': {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    category: 'search'
  },
  'academic-search': {
    id: 'academic-search',
    name: 'Academic Search',
    description: 'Search academic papers and research',
    category: 'search'
  },
  'memory': {
    id: 'memory',
    name: 'Memory',
    description: 'Save and recall information',
    category: 'personalization'
  },
  'custom-instructions': {
    id: 'custom-instructions',
    name: 'Custom Instructions',
    description: 'Set personalized AI behavior',
    category: 'personalization'
  },
  'voice-input': {
    id: 'voice-input',
    name: 'Voice Input',
    description: 'Speak instead of typing',
    category: 'input'
  },
  'image-upload': {
    id: 'image-upload',
    name: 'Image Upload',
    description: 'Upload and analyze images',
    category: 'input'
  },
  'code-execution': {
    id: 'code-execution',
    name: 'Code Execution',
    description: 'Run Python code',
    category: 'tools'
  },
  'maps': {
    id: 'maps',
    name: 'Maps',
    description: 'View maps and locations',
    category: 'tools'
  },
  'weather': {
    id: 'weather',
    name: 'Weather',
    description: 'Get weather information',
    category: 'tools'
  },
  'stocks': {
    id: 'stocks',
    name: 'Stock Market',
    description: 'Track stock prices',
    category: 'tools'
  },
  'crypto': {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'Track crypto prices',
    category: 'tools'
  },
  'movies': {
    id: 'movies',
    name: 'Movies & TV',
    description: 'Search movies and TV shows',
    category: 'search'
  },
  'reddit': {
    id: 'reddit',
    name: 'Reddit Search',
    description: 'Search Reddit discussions',
    category: 'search'
  },
  'twitter': {
    id: 'twitter',
    name: 'X/Twitter Search',
    description: 'Search X/Twitter posts',
    category: 'search'
  },
  'youtube': {
    id: 'youtube',
    name: 'YouTube Search',
    description: 'Search YouTube videos',
    category: 'search'
  },
  'flight-tracker': {
    id: 'flight-tracker',
    name: 'Flight Tracker',
    description: 'Track flights in real-time',
    category: 'tools'
  },
  'currency-converter': {
    id: 'currency-converter',
    name: 'Currency Converter',
    description: 'Convert between currencies',
    category: 'tools'
  }
};

export class FeatureDiscovery {
  private static STORAGE_KEY = 'discovered_features';
  private static USAGE_KEY = 'feature_usage';

  static getDiscoveredFeatures(): Set<FeatureId> {
    if (typeof window === 'undefined') return new Set();
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return new Set();
    
    try {
      const features = JSON.parse(stored);
      return new Set(features);
    } catch {
      return new Set();
    }
  }

  static markDiscovered(featureId: FeatureId): void {
    if (typeof window === 'undefined') return;
    
    const discovered = this.getDiscoveredFeatures();
    discovered.add(featureId);
    
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(Array.from(discovered))
    );
  }

  static getUsageCount(featureId: FeatureId): number {
    if (typeof window === 'undefined') return 0;
    
    const stored = localStorage.getItem(this.USAGE_KEY);
    if (!stored) return 0;
    
    try {
      const usage = JSON.parse(stored);
      return usage[featureId] || 0;
    } catch {
      return 0;
    }
  }

  static incrementUsage(featureId: FeatureId): void {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(this.USAGE_KEY);
    let usage: Record<string, number> = {};
    
    try {
      if (stored) {
        usage = JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    
    usage[featureId] = (usage[featureId] || 0) + 1;
    
    localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage));
  }

  static getDiscoveryProgress(): {
    discovered: number;
    total: number;
    percentage: number;
    byCategory: Record<string, { discovered: number; total: number }>;
  } {
    const discovered = this.getDiscoveredFeatures();
    const allFeatures = Object.values(FEATURES);
    
    const byCategory = allFeatures.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = { discovered: 0, total: 0 };
      }
      acc[feature.category].total++;
      if (discovered.has(feature.id)) {
        acc[feature.category].discovered++;
      }
      return acc;
    }, {} as Record<string, { discovered: number; total: number }>);
    
    return {
      discovered: discovered.size,
      total: allFeatures.length,
      percentage: Math.round((discovered.size / allFeatures.length) * 100),
      byCategory
    };
  }

  static reset(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USAGE_KEY);
  }
}