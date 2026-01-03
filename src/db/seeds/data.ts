/**
 * @fileoverview Test data for seeding
 *
 * Contains all test data organized by entity.
 * Modify this file to add/change test users, posts, etc.
 */

// ============================================================================
// DATA GENERATORS
// ============================================================================

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery',
  'Sebastian', 'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe',
  'Samuel', 'Victoria', 'Joseph', 'Riley', 'John', 'Aria', 'David', 'Lily',
  'Wyatt', 'Aubrey', 'Carter', 'Zoey', 'Jayden', 'Penelope', 'Luke', 'Lillian',
  'Gabriel', 'Addison', 'Anthony', 'Jane', 'Mike', 'Sarah', 'Alex', 'Lisa'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Doe'
];

const BIO_TEMPLATES = [
  '🌟 Living my best life',
  '📸 Photography enthusiast',
  '☕ Coffee lover | 🌍 World traveler',
  '💼 Entrepreneur | 🎯 Goal setter',
  '🎨 Creative soul',
  '🏃 Fitness addict',
  '📚 Bookworm | ✍️ Writer',
  '🎵 Music is life',
  '🍕 Foodie adventures',
  '🌱 Plant parent',
  '🐶 Dog mom/dad',
  '🎬 Film buff',
  '🏔️ Adventure seeker',
  '🧘 Mindfulness practitioner',
  '💻 Tech enthusiast',
  '🎮 Gamer',
  '🌈 Spreading positivity',
  '🏖️ Beach lover',
  '🍰 Baking enthusiast',
  '🚴 Cyclist',
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function generateUsername(firstName: string, lastName: string, index: number): string {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  if (index === 0) return base;
  return `${base}${index}`;
}

function generateEmail(username: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'example.com'];
  return `${username}@${randomElement(domains)}`;
}

function generateDateOfBirth(): string {
  const year = randomInt(1980, 2005);
  const month = randomInt(1, 12).toString().padStart(2, '0');
  const day = randomInt(1, 28).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// USERS - Generate 55 users
// ============================================================================

const NUM_USERS = 55;

export const TEST_USERS = Array.from({ length: NUM_USERS }, (_, i) => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const username = generateUsername(firstName, lastName, i);

  return {
    email: generateEmail(username),
    phone_number: randomBool(0.7) ? `+1${randomInt(2000000000, 9999999999)}` : null,
    password: 'password123',
    date_of_birth: generateDateOfBirth(),
  };
});

// ============================================================================
// PROFILES - Generate 55 profiles
// ============================================================================

export const TEST_PROFILES = Array.from({ length: NUM_USERS }, (_, i) => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const username = generateUsername(firstName, lastName, i);
  const fullName = `${firstName} ${lastName}`;

  return {
    username,
    full_name: fullName,
    bio: randomBool(0.7) ? randomElement(BIO_TEMPLATES) : null,
    website_url: randomBool(0.3) ? `https://${username}.com` : null,
    is_private: randomBool(0.25), // 25% private accounts
    is_verified: randomBool(0.15), // 15% verified accounts
  };
});

// ============================================================================
// POSTS - Caption templates
// ============================================================================

const POST_CAPTIONS = [
  'Another beautiful day ☀️',
  'Living for moments like these',
  'Grateful for this view',
  'Can\'t believe this is real 😍',
  'Just vibing ✨',
  'Weekend mood',
  'Making memories',
  'Good times with great people',
  'Chasing sunsets',
  'Adventure awaits',
  'Feeling blessed',
  'Life is beautiful',
  'Creating my own sunshine',
  'Just because',
  'No filter needed',
  'Capturing the moment',
  'Living my truth',
  'Here\'s to the good times',
  'Happiness looks good on me',
  'Throwback to this amazing day',
];

// Each profile will get 5-10 posts dynamically generated in seeders
export const TEST_POSTS = POST_CAPTIONS.map(caption => ({
  caption,
  likes: randomInt(10, 500),
  comments: randomInt(0, 50),
}));

// ============================================================================
// POST ASSIGNMENTS - All profiles get posts
// ============================================================================

export const POST_ASSIGNMENTS = Array.from({ length: NUM_USERS }, (_, i) => ({
  profileIndex: i,
  count: randomInt(5, 10), // Each profile gets 5-10 posts
}));

// ============================================================================
// STORIES - Will be generated dynamically per profile in seeders
// ============================================================================

// Each profile will get 3-6 stories with picsum URLs
// Stories will have extended expiration (2030-12-31)
export const TEST_STORIES: Array<{
  profileIndex: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number;
}> = [];

// ============================================================================
// FOLLOWS - Will be generated dynamically in seeders
// ============================================================================

// Follows will be generated with:
// - ~30% probability of following any other user
// - Pending requests for private accounts (~15% of follows to private accounts)
// - Complex social graph with multiple connections
export const TEST_FOLLOWS: Array<{
  followerIndex: number;
  followingIndex: number;
  status: 'accepted' | 'pending' | 'rejected';
}> = [];
