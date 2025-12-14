// Gender detection from first names
// Uses a combination of known name lookups and pattern matching

const MALE_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph',
  'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark',
  'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian',
  'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan', 'jacob',
  'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
  'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander',
  'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'nathan',
  'henry', 'douglas', 'zachary', 'peter', 'kyle', 'noah', 'ethan', 'jeremy',
  'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean', 'gerald',
  'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan',
  'billy', 'bruce', 'gabriel', 'joe', 'logan', 'albert', 'willie', 'alan', 'eugene',
  'russell', 'vincent', 'philip', 'bobby', 'johnny', 'bradley', 'roy', 'ralph',
  'eugene', 'randy', 'wayne', 'howard', 'carlos', 'victor', 'ricky', 'luis',
  'martin', 'raj', 'amit', 'rahul', 'vikram', 'suresh', 'rajesh', 'vijay', 'arun',
  'sanjay', 'kumar', 'prakash', 'deepak', 'vinod', 'manoj', 'ramesh', 'mohammed',
  'ali', 'ahmed', 'omar', 'hassan', 'abdullah', 'mustafa', 'wei', 'chen', 'zhang'
]);

const FEMALE_NAMES = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan',
  'jessica', 'sarah', 'karen', 'lisa', 'nancy', 'betty', 'margaret', 'sandra',
  'ashley', 'kimberly', 'emily', 'donna', 'michelle', 'dorothy', 'carol',
  'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura',
  'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela',
  'emma', 'nicole', 'helen', 'samantha', 'katherine', 'christine', 'debra',
  'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather', 'diane', 'ruth',
  'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren', 'christina',
  'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline',
  'martha', 'gloria', 'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn',
  'janice', 'jean', 'abigail', 'alice', 'julia', 'judy', 'sophia', 'grace',
  'denise', 'amber', 'doris', 'marilyn', 'danielle', 'beverly', 'isabella',
  'theresa', 'diana', 'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis',
  'priya', 'anita', 'sunita', 'pooja', 'neha', 'anjali', 'swati', 'kavita', 'meena',
  'rekha', 'geeta', 'sita', 'radha', 'lakshmi', 'fatima', 'aisha', 'mariam', 'mei'
]);

// Common female name endings across cultures
const FEMALE_ENDINGS = ['a', 'ie', 'y', 'ine', 'elle', 'ette', 'ia', 'ina', 'ika'];

// Common male name endings
const MALE_ENDINGS = ['o', 'us', 'er', 'on', 'an', 'en', 'esh', 'aj', 'ik'];

/**
 * Extract first name from full name string
 */
function getFirstName(fullName: string): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0].toLowerCase();
}

/**
 * Check if name matches common ending patterns
 */
function checkEndings(name: string): 'male' | 'female' | null {
  const lower = name.toLowerCase();
  
  for (const ending of FEMALE_ENDINGS) {
    if (lower.endsWith(ending) && lower.length > ending.length + 1) {
      return 'female';
    }
  }
  
  for (const ending of MALE_ENDINGS) {
    if (lower.endsWith(ending) && lower.length > ending.length + 1) {
      return 'male';
    }
  }
  
  return null;
}

/**
 * Detect gender from a person's name
 * Returns 'Male', 'Female', or null if uncertain
 */
export function detectGender(fullName: string): string | null {
  if (!fullName || fullName.trim().length === 0) {
    return null;
  }

  const firstName = getFirstName(fullName);
  
  if (firstName.length < 2) {
    return null;
  }

  // Direct lookup first - most reliable
  if (MALE_NAMES.has(firstName)) {
    return 'Male';
  }
  
  if (FEMALE_NAMES.has(firstName)) {
    return 'Female';
  }

  // Fall back to pattern matching
  const patternResult = checkEndings(firstName);
  if (patternResult) {
    return patternResult === 'male' ? 'Male' : 'Female';
  }

  return null;
}

