/**
 * Location Matcher for Clinical Trials
 * 
 * Intelligent location matching that understands metropolitan areas,
 * nearby cities, and multi-site trials.
 */

interface LocationInfo {
  city?: string;
  state?: string;
  country?: string;
  facility?: string;
  distance?: number;
  zipCode?: string;
}

interface MetroArea {
  name: string;
  center: string;
  state: string;
  cities: string[];
  majorFacilities: string[];
  radius: number; // in miles
}

export class LocationMatcher {
  // Metropolitan area definitions
  private static readonly METRO_AREAS: MetroArea[] = [
    {
      name: 'Chicago Metropolitan Area',
      center: 'Chicago',
      state: 'Illinois',
      cities: [
        'Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield',
        'Elgin', 'Waukegan', 'Cicero', 'Arlington Heights', 'Evanston',
        'Schaumburg', 'Bolingbrook', 'Palatine', 'Skokie', 'Des Plaines',
        'Orland Park', 'Tinley Park', 'Oak Lawn', 'Berwyn', 'Mount Prospect',
        'Wheaton', 'Oak Park', 'Downers Grove', 'Elmhurst', 'Lombard',
        'Buffalo Grove', 'Bartlett', 'Crystal Lake', 'Carol Stream', 'Wheeling',
        'Park Ridge', 'Addison', 'Northbrook', 'Elk Grove Village', 'Glenview',
        'Highland Park', 'Wilmette', 'Oak Forest', 'Niles', 'West Chicago',
        'Burbank', 'Winnetka', 'Lake Forest', 'Hinsdale', 'Rosemont'
      ],
      majorFacilities: [
        'Northwestern', 'Northwestern Medicine', 'Northwestern Memorial',
        'University of Chicago', 'UChicago', 'UC Medicine',
        'Rush', 'Rush University', 'Rush Medical',
        'Loyola', 'Loyola Medicine', 'Loyola University',
        'Advocate', 'Advocate Health', 'Advocate Lutheran',
        'NorthShore', 'NorthShore University',
        'Lurie', "Lurie Children's", 'Ann & Robert H. Lurie',
        'Cook County', 'Stroger',
        'Jesse Brown VA', 'Hines VA'
      ],
      radius: 50
    },
    {
      name: 'New York Metropolitan Area',
      center: 'New York',
      state: 'New York',
      cities: [
        'New York', 'NYC', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island',
        'Yonkers', 'New Rochelle', 'Mount Vernon', 'White Plains', 'Scarsdale',
        'Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge',
        'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Passaic',
        'Union City', 'Bayonne', 'East Orange', 'Hoboken', 'West New York',
        'Plainfield', 'Wayne', 'Irvington', 'Parsippany', 'Hackensack',
        'Fort Lee', 'Englewood', 'Livingston', 'Teaneck', 'West Orange'
      ],
      majorFacilities: [
        'Memorial Sloan Kettering', 'MSKCC', 'MSK',
        'Mount Sinai', 'Mount Sinai Health',
        'NYU', 'NYU Langone', 'NYU Medical',
        'Columbia', 'Columbia Medical', 'NewYork-Presbyterian',
        'Cornell', 'Weill Cornell',
        'Montefiore', 'Einstein',
        'Northwell', 'Northwell Health',
        'Hackensack', 'Hackensack Meridian'
      ],
      radius: 50
    },
    {
      name: 'Los Angeles Metropolitan Area',
      center: 'Los Angeles',
      state: 'California',
      cities: [
        'Los Angeles', 'LA', 'Long Beach', 'Anaheim', 'Santa Ana', 'Irvine',
        'Glendale', 'Huntington Beach', 'Santa Clarita', 'Garden Grove',
        'Lancaster', 'Palmdale', 'Pomona', 'Torrance', 'Orange', 'Pasadena',
        'Fullerton', 'El Monte', 'Downey', 'Costa Mesa', 'Inglewood', 'Ventura',
        'West Covina', 'Norwalk', 'Burbank', 'Compton', 'South Gate', 'Mission Viejo',
        'Carson', 'Santa Monica', 'Westminster', 'Santa Barbara', 'Whittier',
        'Newport Beach', 'Hawthorne', 'Alhambra', 'Buena Park', 'Lakewood',
        'Beverly Hills', 'Culver City', 'West Hollywood', 'Malibu', 'Redondo Beach'
      ],
      majorFacilities: [
        'UCLA', 'UCLA Medical', 'UCLA Health',
        'USC', 'USC Medical', 'Keck Medicine',
        'Cedars-Sinai', 'Cedars Sinai',
        'City of Hope',
        'Kaiser', 'Kaiser Permanente',
        'Providence', 'Providence Health',
        'Hoag', 'Hoag Memorial',
        'Huntington', 'Huntington Memorial'
      ],
      radius: 60
    },
    {
      name: 'San Francisco Bay Area',
      center: 'San Francisco',
      state: 'California',
      cities: [
        'San Francisco', 'SF', 'Oakland', 'San Jose', 'Fremont', 'Hayward',
        'Sunnyvale', 'Santa Clara', 'Concord', 'Santa Rosa', 'Berkeley',
        'Vallejo', 'Fairfield', 'Richmond', 'Antioch', 'Daly City', 'San Mateo',
        'Vacaville', 'San Leandro', 'Livermore', 'Redwood City', 'Mountain View',
        'Alameda', 'Pleasanton', 'Union City', 'Napa', 'Milpitas', 'Walnut Creek',
        'Palo Alto', 'San Rafael', 'Novato', 'San Bruno', 'Pittsburg', 'Cupertino',
        'Menlo Park', 'Petaluma', 'South San Francisco', 'Foster City', 'Burlingame'
      ],
      majorFacilities: [
        'UCSF', 'UCSF Medical', 'UCSF Health',
        'Stanford', 'Stanford Medical', 'Stanford Health',
        'Kaiser', 'Kaiser Permanente',
        'Sutter', 'Sutter Health',
        'John Muir', 'John Muir Health'
      ],
      radius: 50
    },
    {
      name: 'Boston Metropolitan Area',
      center: 'Boston',
      state: 'Massachusetts',
      cities: [
        'Boston', 'Cambridge', 'Quincy', 'Lynn', 'Newton', 'Somerville',
        'Lawrence', 'Framingham', 'Haverhill', 'Waltham', 'Malden', 'Brookline',
        'Plymouth', 'Medford', 'Taunton', 'Weymouth', 'Revere', 'Peabody',
        'Methuen', 'Everett', 'Salem', 'Woburn', 'Chelsea', 'Watertown',
        'Arlington', 'Marlborough', 'Dedham', 'Lexington', 'Natick', 'Wellesley',
        'Milton', 'Needham', 'Braintree', 'Norwood', 'Randolph', 'Stoughton'
      ],
      majorFacilities: [
        'Dana-Farber', 'Dana Farber', 'DFCI',
        'Mass General', 'Massachusetts General', 'MGH',
        'Brigham', "Brigham and Women's", 'BWH',
        'Beth Israel', 'Beth Israel Deaconess', 'BIDMC',
        'Boston Medical', 'BMC',
        'Tufts', 'Tufts Medical',
        "Boston Children's", 'BCH'
      ],
      radius: 40
    }
  ];

  /**
   * Check if a study location matches the user's location
   */
  static matchesLocation(study: { protocolSection?: { contactsLocationsModule?: any; sponsorCollaboratorsModule?: any } }, userLocation: string): boolean {
    if (!userLocation) return true; // No location filter

    const locationVariations = this.generateLocationTerms(userLocation);
    const studyLocations = this.extractStudyLocations(study);

    // Check if any study location matches any user location variation
    for (const studyLoc of studyLocations) {
      for (const userLoc of locationVariations) {
        if (this.locationMatch(studyLoc, userLoc)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Generate all possible location terms for a user location
   */
  private static generateLocationTerms(location: string): Set<string> {
    const terms = new Set<string>();
    const locationLower = location.toLowerCase();
    
    // Add original term
    terms.add(locationLower);

    // Find matching metro area
    for (const metro of this.METRO_AREAS) {
      const metroMatch = 
        metro.center.toLowerCase() === locationLower ||
        metro.cities.some(city => city.toLowerCase() === locationLower) ||
        metro.name.toLowerCase().includes(locationLower);

      if (metroMatch) {
        // Add all cities in metro area
        metro.cities.forEach(city => terms.add(city.toLowerCase()));
        
        // Add major facilities
        metro.majorFacilities.forEach(facility => terms.add(facility.toLowerCase()));
        
        // Add state variations
        terms.add(metro.state.toLowerCase());
        terms.add(this.getStateAbbreviation(metro.state).toLowerCase());
        
        // Add metro area name
        terms.add(metro.name.toLowerCase());
        terms.add(metro.center.toLowerCase() + ' area');
        terms.add(metro.center.toLowerCase() + ' metro');
      }
    }

    // Add state abbreviations
    const stateAbbr = this.getStateAbbreviation(location);
    if (stateAbbr) {
      terms.add(stateAbbr.toLowerCase());
    }

    return terms;
  }

  /**
   * Extract all locations from a study
   */
  private static extractStudyLocations(study: { protocolSection?: { contactsLocationsModule?: any; sponsorCollaboratorsModule?: any } }): LocationInfo[] {
    const locations: LocationInfo[] = [];

    // Extract from locations module
    const locationsModule = study.protocolSection?.contactsLocationsModule;
    
    if (locationsModule?.locations) {
      for (const loc of locationsModule.locations) {
        locations.push({
          city: loc.city,
          state: loc.state,
          country: loc.country || loc.countryCode,
          facility: loc.facility,
          zipCode: loc.zip
        });
      }
    }

    // Extract from central contacts (sometimes has location info)
    if (locationsModule?.centralContacts) {
      for (const contact of locationsModule.centralContacts) {
        if (contact.affiliation) {
          locations.push({
            facility: contact.affiliation
          });
        }
      }
    }

    // Extract from sponsor info
    const sponsorModule = study.protocolSection?.sponsorCollaboratorsModule;
    if (sponsorModule?.leadSponsor?.name) {
      locations.push({
        facility: sponsorModule.leadSponsor.name
      });
    }

    return locations;
  }

  /**
   * Check if two location strings match
   */
  private static locationMatch(studyLoc: LocationInfo, userTerm: string): boolean {
    const term = userTerm.toLowerCase();

    // Check city
    if (studyLoc.city && studyLoc.city.toLowerCase().includes(term)) {
      return true;
    }

    // Check state
    if (studyLoc.state) {
      const stateLower = studyLoc.state.toLowerCase();
      const stateAbbr = this.getStateAbbreviation(studyLoc.state).toLowerCase();
      if (stateLower.includes(term) || stateAbbr === term) {
        return true;
      }
    }

    // Check facility
    if (studyLoc.facility && studyLoc.facility.toLowerCase().includes(term)) {
      return true;
    }

    // Check if term is a known metro area and study is in that metro
    for (const metro of this.METRO_AREAS) {
      const isUserInMetro = 
        metro.cities.some(city => city.toLowerCase() === term) ||
        metro.majorFacilities.some(facility => facility.toLowerCase().includes(term));

      if (isUserInMetro) {
        const isStudyInMetro = 
          (studyLoc.city && metro.cities.some(city => 
            city.toLowerCase() === studyLoc.city!.toLowerCase())) ||
          (studyLoc.facility && metro.majorFacilities.some(facility => 
            studyLoc.facility!.toLowerCase().includes(facility.toLowerCase())));

        if (isStudyInMetro) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get state abbreviation
   */
  private static getStateAbbreviation(state: string): string {
    const stateMap: { [key: string]: string } = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY'
    };

    return stateMap[state.toLowerCase()] || state;
  }

  /**
   * Filter studies by location
   */
  static filterByLocation<T extends { protocolSection?: { contactsLocationsModule?: any; sponsorCollaboratorsModule?: any } }>(studies: T[], userLocation: string): T[] {
    if (!userLocation) return studies;

    return studies.filter(study => this.matchesLocation(study, userLocation));
  }

  /**
   * Get location summary for a study
   */
  static getLocationSummary(study: { protocolSection?: { contactsLocationsModule?: any } }): string[] {
    const locations = this.extractStudyLocations(study);
    const uniqueLocations = new Set<string>();

    locations.forEach(loc => {
      if (loc.city && loc.state) {
        uniqueLocations.add(`${loc.city}, ${this.getStateAbbreviation(loc.state)}`);
      } else if (loc.facility) {
        uniqueLocations.add(loc.facility);
      }
    });

    return Array.from(uniqueLocations).slice(0, 5); // Return top 5 locations
  }
}