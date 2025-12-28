/**
 * @fileoverview Test data for seeding
 *
 * Contains all test data organized by entity.
 * Modify this file to add/change test users, posts, etc.
 */

// ============================================================================
// USERS
// ============================================================================

export const TEST_USERS = [
  {
    email: 'john@example.com',
    phone_number: '+1234567890',
    password: 'password123',
    date_of_birth: '1990-01-15',
  },
  {
    email: 'jane@example.com',
    phone_number: '+1234567891',
    password: 'password123',
    date_of_birth: '1992-05-20',
  },
  {
    email: 'mike@example.com',
    phone_number: '+1234567892',
    password: 'password123',
    date_of_birth: '1988-11-10',
  },
  {
    email: 'sarah@example.com',
    phone_number: '+1234567893',
    password: 'password123',
    date_of_birth: '1995-03-25',
  },
];

// ============================================================================
// PROFILES
// ============================================================================

export const TEST_PROFILES = [
  {
    username: 'johndoe',
    full_name: 'John Doe',
    bio: 'Photography enthusiast 📸\nTravel lover ✈️\n@janedoe is my best friend',
    website_url: 'https://johndoe.com',
    is_private: false,
    is_verified: true,
  },
  {
    username: 'janedoe',
    full_name: 'Jane Doe',
    bio: 'Digital artist 🎨\nCreating magic every day\n#art #design',
    website_url: 'https://janedoe.art',
    is_private: false,
    is_verified: false,
  },
  {
    username: 'mikeprivate',
    full_name: 'Mike Private',
    bio: 'Private account 🔒\nFollow to see my posts',
    website_url: null,
    is_private: true,
    is_verified: false,
  },
  {
    username: 'sarahpublic',
    full_name: 'Sarah Public',
    bio: 'Fitness coach 💪\nHealthy lifestyle advocate\nDM for coaching',
    website_url: 'https://sarahfitness.com',
    is_private: false,
    is_verified: true,
  },
];

// ============================================================================
// POSTS
// ============================================================================

export const TEST_POSTS = [
  // John's posts (6 posts)
  { caption: 'Beautiful sunset 🌅', likes: 142, comments: 12 },
  { caption: 'Coffee time ☕', likes: 89, comments: 5 },
  { caption: 'New camera! 📷', likes: 234, comments: 18 },
  { caption: 'City lights at night', likes: 167, comments: 9 },
  { caption: 'Weekend vibes', likes: 201, comments: 15 },
  { caption: 'Mountain hiking 🏔️', likes: 312, comments: 24 },

  // Jane's posts (4 posts)
  { caption: 'Latest artwork 🎨', likes: 456, comments: 32 },
  { caption: 'Work in progress...', likes: 298, comments: 19 },
  { caption: 'Color palette inspiration', likes: 187, comments: 11 },
  { caption: 'Digital painting tutorial', likes: 523, comments: 45 },

  // Sarah's posts (4 posts)
  { caption: 'Morning workout routine 💪', likes: 678, comments: 41 },
  { caption: 'Meal prep Sunday!', likes: 445, comments: 28 },
  { caption: 'Transformation Tuesday', likes: 892, comments: 67 },
  { caption: 'Fitness tips for beginners', likes: 756, comments: 53 },
];

// ============================================================================
// POST ASSIGNMENTS
// ============================================================================

export const POST_ASSIGNMENTS = [
  { profileIndex: 0, count: 6 }, // John: 6 posts
  { profileIndex: 1, count: 4 }, // Jane: 4 posts
  { profileIndex: 3, count: 4 }, // Sarah: 4 posts (Mike has 0)
];

// ============================================================================
// FOLLOWS
// ============================================================================

export const TEST_FOLLOWS = [
  { followerIndex: 0, followingIndex: 1, status: 'accepted' }, // John → Jane
  { followerIndex: 1, followingIndex: 0, status: 'accepted' }, // Jane → John
  { followerIndex: 0, followingIndex: 3, status: 'accepted' }, // John → Sarah
  { followerIndex: 1, followingIndex: 2, status: 'pending' },  // Jane → Mike (pending)
];
