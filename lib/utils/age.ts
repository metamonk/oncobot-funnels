/**
 * Age calculation utilities
 */

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: Date | string, referenceDate: Date = new Date()): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  // Validate date
  if (isNaN(dob.getTime())) {
    throw new Error('Invalid date of birth');
  }
  
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  
  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }
  
  return Math.max(0, age); // Ensure non-negative
}

/**
 * Format date of birth for display
 * @param dateOfBirth - Date of birth
 * @returns Formatted date string
 */
export function formatDateOfBirth(dateOfBirth: Date | string): string {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  if (isNaN(dob.getTime())) {
    return 'Unknown';
  }
  
  return dob.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get age group for clinical trial matching
 * @param age - Age in years
 * @returns Age group category
 */
export function getAgeGroup(age: number): string {
  if (age < 18) return 'Pediatric';
  if (age < 65) return 'Adult';
  return 'Older Adult';
}

/**
 * Check if age meets trial requirements
 * @param age - Patient age
 * @param minAge - Minimum age requirement (e.g., "18 Years")
 * @param maxAge - Maximum age requirement (e.g., "65 Years")
 * @returns Object with eligibility status and message
 */
export function checkAgeEligibility(
  age: number,
  minAge?: string,
  maxAge?: string
): { eligible: boolean; message: string } {
  const parseAgeString = (ageStr?: string): number | null => {
    if (!ageStr || ageStr === 'N/A') return null;
    const match = ageStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };
  
  const minAgeNum = parseAgeString(minAge);
  const maxAgeNum = parseAgeString(maxAge);
  
  if (minAgeNum !== null && age < minAgeNum) {
    return {
      eligible: false,
      message: `Age ${age} is below minimum requirement of ${minAge}`
    };
  }
  
  if (maxAgeNum !== null && maxAgeNum < 999 && age > maxAgeNum) {
    return {
      eligible: false,
      message: `Age ${age} exceeds maximum limit of ${maxAge}`
    };
  }
  
  let message = `Age ${age}`;
  if (minAgeNum !== null && maxAgeNum !== null && maxAgeNum < 999) {
    message += ` meets requirements (${minAge} - ${maxAge})`;
  } else if (minAgeNum !== null) {
    message += ` meets minimum requirement (${minAge}+)`;
  }
  
  return {
    eligible: true,
    message
  };
}