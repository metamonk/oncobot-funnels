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
    },
    {
      name: 'Houston Metropolitan Area',
      center: 'Houston',
      state: 'Texas',
      cities: [
        'Houston', 'The Woodlands', 'Sugar Land', 'Pasadena', 'Pearland',
        'League City', 'Baytown', 'Missouri City', 'Conroe', 'Galveston',
        'Texas City', 'Friendswood', 'La Porte', 'Deer Park', 'Rosenberg',
        'Stafford', 'Bellaire', 'West University Place', 'Katy', 'Spring',
        'Cypress', 'Humble', 'Kingwood', 'Clear Lake', 'Webster'
      ],
      majorFacilities: [
        'MD Anderson', 'MD Anderson Cancer Center', 'MDACC',
        'Houston Methodist', 'Methodist Hospital',
        'Texas Medical Center', 'TMC',
        'Baylor', 'Baylor College of Medicine', 'BCM',
        'Memorial Hermann', 'UTHealth', 'UT Health',
        'Texas Children\'s', 'Texas Children\'s Hospital',
        'Harris Health', 'Ben Taub'
      ],
      radius: 50
    },
    {
      name: 'Minneapolis-St. Paul Metropolitan Area',
      center: 'Minneapolis',
      state: 'Minnesota',
      cities: [
        'Minneapolis', 'St. Paul', 'Saint Paul', 'Bloomington', 'Plymouth',
        'Woodbury', 'Maple Grove', 'Blaine', 'Lakeville', 'Burnsville',
        'Minnetonka', 'Eden Prairie', 'Apple Valley', 'Edina', 'St. Louis Park',
        'Richfield', 'Roseville', 'Inver Grove Heights', 'Brooklyn Park',
        'Shakopee', 'Cottage Grove', 'Eagan', 'Rochester'
      ],
      majorFacilities: [
        'Mayo Clinic', 'Mayo', 'Mayo Rochester',
        'University of Minnesota', 'UMN', 'U of M',
        'Abbott Northwestern', 'Allina Health',
        'Regions Hospital', 'HealthPartners',
        'Hennepin Healthcare', 'HCMC',
        'Children\'s Minnesota', 'Park Nicollet'
      ],
      radius: 60
    },
    {
      name: 'Philadelphia Metropolitan Area',
      center: 'Philadelphia',
      state: 'Pennsylvania',
      cities: [
        'Philadelphia', 'Philly', 'Camden', 'Wilmington', 'Chester',
        'Bensalem', 'Bristol', 'Levittown', 'King of Prussia', 'Norristown',
        'Upper Darby', 'Lower Merion', 'Abington', 'Haverford', 'Bryn Mawr',
        'Media', 'West Chester', 'Conshohocken', 'Lansdale', 'Doylestown',
        'Cherry Hill', 'Voorhees', 'Mount Laurel', 'Moorestown', 'Princeton'
      ],
      majorFacilities: [
        'Penn', 'Penn Medicine', 'University of Pennsylvania', 'UPenn',
        'Jefferson', 'Thomas Jefferson', 'Sidney Kimmel',
        'Fox Chase', 'Fox Chase Cancer Center',
        'Temple', 'Temple University Hospital',
        'CHOP', 'Children\'s Hospital of Philadelphia',
        'Wistar', 'Wistar Institute'
      ],
      radius: 50
    },
    {
      name: 'Seattle Metropolitan Area',
      center: 'Seattle',
      state: 'Washington',
      cities: [
        'Seattle', 'Tacoma', 'Bellevue', 'Kent', 'Everett', 'Renton',
        'Federal Way', 'Spokane', 'Vancouver', 'Yakima', 'Bellingham',
        'Kirkland', 'Redmond', 'Sammamish', 'Auburn', 'Lakewood', 'Shoreline',
        'Marysville', 'Puyallup', 'Olympia', 'Lacey', 'Edmonds', 'Bremerton',
        'Lynnwood', 'Bothell', 'Burien', 'Des Moines', 'SeaTac', 'Issaquah'
      ],
      majorFacilities: [
        'Fred Hutchinson', 'Fred Hutch', 'FHCRC',
        'Seattle Cancer Care Alliance', 'SCCA',
        'University of Washington', 'UW Medicine', 'UW Medical',
        'Seattle Children\'s', 'Swedish', 'Swedish Medical',
        'Virginia Mason', 'Harborview', 'Northwest Hospital',
        'Overlake', 'EvergreenHealth'
      ],
      radius: 60
    },
    {
      name: 'Atlanta Metropolitan Area',
      center: 'Atlanta',
      state: 'Georgia',
      cities: [
        'Atlanta', 'ATL', 'Sandy Springs', 'Roswell', 'Johns Creek',
        'Alpharetta', 'Marietta', 'Smyrna', 'Dunwoody', 'Brookhaven',
        'Peachtree City', 'East Point', 'Milton', 'Kennesaw', 'Duluth',
        'Lawrenceville', 'Decatur', 'Tucker', 'Stockbridge', 'Woodstock',
        'Canton', 'McDonough', 'Douglasville', 'Union City', 'Forest Park'
      ],
      majorFacilities: [
        'Emory', 'Emory University', 'Emory Healthcare',
        'Winship', 'Winship Cancer Institute',
        'Grady', 'Grady Health',
        'Piedmont', 'Piedmont Healthcare',
        'Northside', 'Northside Hospital',
        'Children\'s Healthcare of Atlanta', 'CHOA',
        'WellStar', 'Kaiser Permanente Georgia'
      ],
      radius: 50
    },
    {
      name: 'Washington DC Metropolitan Area',
      center: 'Washington',
      state: 'District of Columbia',
      cities: [
        'Washington', 'DC', 'Washington DC', 'Arlington', 'Alexandria',
        'Silver Spring', 'Bethesda', 'Frederick', 'Rockville', 'Gaithersburg',
        'Bowie', 'Annandale', 'Centreville', 'Dale City', 'Reston', 'Fairfax',
        'Germantown', 'Waldorf', 'Wheaton', 'McLean', 'Potomac', 'Chevy Chase',
        'College Park', 'Greenbelt', 'Laurel', 'Beltsville', 'Takoma Park'
      ],
      majorFacilities: [
        'NIH', 'National Institutes of Health',
        'NCI', 'National Cancer Institute',
        'Johns Hopkins', 'Hopkins', 'JHU',
        'Georgetown', 'Georgetown University', 'MedStar Georgetown',
        'George Washington', 'GW', 'GWU',
        'Howard University Hospital',
        'Inova', 'Inova Health',
        'Walter Reed', 'WRNMMC'
      ],
      radius: 50
    },
    {
      name: 'Miami Metropolitan Area',
      center: 'Miami',
      state: 'Florida',
      cities: [
        'Miami', 'Fort Lauderdale', 'West Palm Beach', 'Miami Beach',
        'Pembroke Pines', 'Hollywood', 'Miramar', 'Coral Springs', 'Pompano Beach',
        'Doral', 'Davie', 'Plantation', 'Sunrise', 'Boca Raton', 'Deerfield Beach',
        'Boynton Beach', 'Lauderhill', 'Weston', 'Homestead', 'Delray Beach',
        'Aventura', 'Miami Gardens', 'Wellington', 'Jupiter', 'Coconut Creek'
      ],
      majorFacilities: [
        'Sylvester', 'Sylvester Comprehensive', 'University of Miami',
        'Jackson', 'Jackson Health', 'Jackson Memorial',
        'Baptist', 'Baptist Health South Florida',
        'Mount Sinai Medical Center Miami',
        'Cleveland Clinic Florida',
        'Memorial Healthcare', 'Memorial Regional',
        'Broward Health', 'Holy Cross'
      ],
      radius: 60
    },
    {
      name: 'Phoenix Metropolitan Area',
      center: 'Phoenix',
      state: 'Arizona',
      cities: [
        'Phoenix', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert',
        'Tempe', 'Peoria', 'Surprise', 'Avondale', 'Goodyear', 'Buckeye',
        'Queen Creek', 'Sun City', 'Casa Grande', 'Maricopa', 'Apache Junction',
        'El Mirage', 'Fountain Hills', 'Paradise Valley', 'Cave Creek', 'Anthem'
      ],
      majorFacilities: [
        'Mayo Clinic Arizona', 'Mayo Scottsdale',
        'Banner', 'Banner Health', 'Banner MD Anderson',
        'Honor Health', 'HonorHealth',
        'Dignity Health', 'St. Joseph\'s',
        'Phoenix Children\'s', 'PCH',
        'Barrow', 'Barrow Neurological'
      ],
      radius: 50
    },
    {
      name: 'Cleveland Metropolitan Area',
      center: 'Cleveland',
      state: 'Ohio',
      cities: [
        'Cleveland', 'Akron', 'Canton', 'Parma', 'Lakewood', 'Elyria',
        'Euclid', 'Mentor', 'Cleveland Heights', 'Strongsville', 'Westlake',
        'Boardman', 'Cuyahoga Falls', 'Lorain', 'Shaker Heights', 'North Olmsted',
        'North Royalton', 'Medina', 'Massillon', 'Barberton', 'Solon', 'Avon'
      ],
      majorFacilities: [
        'Cleveland Clinic', 'Cleveland Clinic Foundation', 'CCF',
        'University Hospitals', 'UH', 'UH Cleveland',
        'MetroHealth', 'Metro Health',
        'Rainbow Babies', 'Rainbow Babies and Children\'s',
        'Case Western', 'CWRU'
      ],
      radius: 50
    },
    {
      name: 'Detroit Metropolitan Area',
      center: 'Detroit',
      state: 'Michigan',
      cities: [
        'Detroit', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing',
        'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills',
        'Rochester Hills', 'Southfield', 'Taylor', 'Pontiac', 'St. Clair Shores',
        'Royal Oak', 'Novi', 'Dearborn Heights', 'Auburn Hills', 'Madison Heights',
        'Bloomfield Hills', 'Birmingham', 'Grosse Pointe'
      ],
      majorFacilities: [
        'Karmanos', 'Barbara Ann Karmanos',
        'Henry Ford', 'Henry Ford Health',
        'Beaumont', 'Beaumont Health',
        'Michigan Medicine', 'University of Michigan', 'U of M',
        'DMC', 'Detroit Medical Center',
        'St. John', 'Ascension St. John'
      ],
      radius: 50
    },
    {
      name: 'San Diego Metropolitan Area',
      center: 'San Diego',
      state: 'California',
      cities: [
        'San Diego', 'SD', 'Chula Vista', 'Oceanside', 'Escondido', 'Carlsbad',
        'El Cajon', 'Vista', 'San Marcos', 'Encinitas', 'National City',
        'La Mesa', 'Santee', 'Poway', 'La Jolla', 'Del Mar', 'Coronado',
        'Imperial Beach', 'Lemon Grove', 'Solana Beach', 'Rancho Santa Fe'
      ],
      majorFacilities: [
        'UCSD', 'UC San Diego', 'UCSD Health', 'Moores Cancer Center',
        'Scripps', 'Scripps Health', 'Scripps Research',
        'Sharp', 'Sharp Healthcare',
        'Kaiser Permanente San Diego',
        'Rady Children\'s', 'Rady Children\'s Hospital'
      ],
      radius: 50
    },
    {
      name: 'Denver Metropolitan Area',
      center: 'Denver',
      state: 'Colorado',
      cities: [
        'Denver', 'Aurora', 'Lakewood', 'Thornton', 'Arvada', 'Westminster',
        'Centennial', 'Colorado Springs', 'Fort Collins', 'Highlands Ranch',
        'Parker', 'Castle Rock', 'Littleton', 'Wheat Ridge', 'Englewood',
        'Northglenn', 'Broomfield', 'Commerce City', 'Greenwood Village',
        'Boulder', 'Longmont', 'Loveland', 'Grand Junction', 'Greeley'
      ],
      majorFacilities: [
        'University of Colorado', 'CU Anschutz', 'UCHealth',
        'National Jewish', 'National Jewish Health',
        'Denver Health', 'Denver General',
        'Children\'s Hospital Colorado', 'Children\'s Colorado',
        'Presbyterian/St. Joseph', 'HealthONE',
        'Kaiser Permanente Colorado'
      ],
      radius: 60
    },
    {
      name: 'Baltimore Metropolitan Area',
      center: 'Baltimore',
      state: 'Maryland',
      cities: [
        'Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf',
        'Glen Burnie', 'Ellicott City', 'Frederick', 'Dundalk', 'Rockville',
        'Bethesda', 'Towson', 'Bowie', 'Severn', 'Odenton', 'Catonsville',
        'Gaithersburg', 'Annapolis', 'Laurel', 'Greenbelt', 'Bel Air'
      ],
      majorFacilities: [
        'Johns Hopkins', 'Hopkins', 'JHU', 'Johns Hopkins Hospital',
        'University of Maryland', 'UMD Medical', 'UMMC',
        'MedStar', 'MedStar Health',
        'Sinai', 'Sinai Hospital',
        'GBMC', 'Greater Baltimore Medical',
        'Kennedy Krieger', 'Sheppard Pratt'
      ],
      radius: 50
    },
    {
      name: 'Pittsburgh Metropolitan Area',
      center: 'Pittsburgh',
      state: 'Pennsylvania',
      cities: [
        'Pittsburgh', 'Penn Hills', 'Mount Lebanon', 'Bethel Park', 'Ross Township',
        'Shaler', 'Plum', 'Moon', 'Upper St. Clair', 'Peters', 'Hampton',
        'Monroeville', 'McCandless', 'Robinson', 'Scott', 'Cranberry',
        'North Hills', 'South Hills', 'Squirrel Hill', 'Shadyside', 'Oakland'
      ],
      majorFacilities: [
        'UPMC', 'University of Pittsburgh Medical Center',
        'Hillman', 'UPMC Hillman Cancer Center',
        'Allegheny Health', 'AHN', 'Allegheny General',
        'Children\'s Hospital of Pittsburgh', 'CHP',
        'Magee', 'Magee-Womens'
      ],
      radius: 40
    },
    {
      name: 'St. Louis Metropolitan Area',
      center: 'St. Louis',
      state: 'Missouri',
      cities: [
        'St. Louis', 'STL', 'Florissant', 'Belleville', 'O\'Fallon',
        'St. Charles', 'St. Peters', 'Chesterfield', 'Wildwood', 'University City',
        'Ballwin', 'Wentzville', 'Kirkwood', 'Maryland Heights', 'Hazelwood',
        'Webster Groves', 'Ferguson', 'Arnold', 'Manchester', 'Clayton'
      ],
      majorFacilities: [
        'Washington University', 'WashU', 'Barnes-Jewish', 'Barnes',
        'Siteman', 'Siteman Cancer Center',
        'St. Louis Children\'s', 'SLCH',
        'SLU', 'Saint Louis University Hospital',
        'Mercy', 'Mercy Hospital',
        'SSM Health', 'SSM'
      ],
      radius: 40
    }
  ];

  /**
   * Check if a study location matches the user's location
   */
  static matchesLocation(study: { protocolSection?: { contactsLocationsModule?: { locations?: Array<{ city?: string; state?: string; country?: string; facility?: string }> }; sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } } } }, userLocation: string): boolean {
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
  private static extractStudyLocations(study: { protocolSection?: { contactsLocationsModule?: { locations?: Array<{ city?: string; state?: string; country?: string; facility?: string; zip?: string }> }; sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } } } }): LocationInfo[] {
    const locations: LocationInfo[] = [];

    // Extract from locations module
    const locationsModule = study.protocolSection?.contactsLocationsModule;
    
    if (locationsModule?.locations) {
      for (const loc of locationsModule.locations) {
        locations.push({
          city: loc.city,
          state: loc.state,
          country: loc.country || (loc as any).countryCode,
          facility: loc.facility,
          zipCode: loc.zip
        });
      }
    }

    // Extract from central contacts (sometimes has location info)
    if ((locationsModule as any)?.centralContacts) {
      for (const contact of (locationsModule as any).centralContacts) {
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
  static filterByLocation<T extends { protocolSection?: { contactsLocationsModule?: { locations?: Array<{ city?: string; state?: string; country?: string; facility?: string }> }; sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } } } }>(studies: T[], userLocation: string): T[] {
    if (!userLocation) return studies;

    return studies.filter(study => this.matchesLocation(study, userLocation));
  }

  /**
   * Get location summary for a study
   */
  static getLocationSummary(study: { protocolSection?: { contactsLocationsModule?: { locations?: Array<{ city?: string; state?: string; country?: string; facility?: string }> } } }): string[] {
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

  /**
   * Get the metropolitan area for a city
   */
  static getMetroArea(city: string): string | undefined {
    if (!city) return undefined;
    
    const cityLower = city.toLowerCase();
    
    for (const metroArea of this.METRO_AREAS) {
      // Check if city is in the metro area's cities list
      if (metroArea.cities.some((c: string) => c.toLowerCase() === cityLower)) {
        return metroArea.name;
      }
      
      // Check if city is the center
      if (metroArea.center.toLowerCase() === cityLower) {
        return metroArea.name;
      }
    }
    
    return undefined;
  }

  /**
   * Check if two locations are in the same metro area
   */
  static isMetroArea(location1: string, location2: string): boolean {
    if (!location1 || !location2) return false;
    
    const loc1Lower = location1.toLowerCase();
    const loc2Lower = location2.toLowerCase();
    
    // Check each metro area
    for (const metroArea of this.METRO_AREAS) {
      const cities = metroArea.cities.map((c: string) => c.toLowerCase());
      const facilities = metroArea.majorFacilities.map((f: string) => f.toLowerCase());
      const allTerms = [...cities, ...facilities, metroArea.center.toLowerCase()];
      
      const loc1InMetro = allTerms.some(term => loc1Lower.includes(term));
      const loc2InMetro = allTerms.some(term => loc2Lower.includes(term));
      
      if (loc1InMetro && loc2InMetro) {
        return true;
      }
    }
    
    return false;
  }
}