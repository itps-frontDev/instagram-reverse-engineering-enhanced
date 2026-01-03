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
// STORIES
// ============================================================================

// Story images from Unsplash (actual URLs)
export const TEST_STORIES = [
  // John's stories (3 stories)
  {
    profileIndex: 0,
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 0,
    media_url: 'https://images.unsplash.com/photo-1495575876299-dba2e866e971?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 0,
    media_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // Jane's stories (3 stories)
  {
    profileIndex: 1,
    media_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 1,
    media_url: 'https://images.unsplash.com/photo-1514306688772-2cecaf7e53f1?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 1,
    media_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // Sarah's stories (3 stories)
  {
    profileIndex: 3,
    media_url: 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 3,
    media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 3,
    media_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // Mike's stories (2 stories - private account)
  {
    profileIndex: 2,
    media_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 2,
    media_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
];

// ============================================================================
// FOLLOWS
// ============================================================================

export const TEST_FOLLOWS = [
  // John's follows
  { followerIndex: 0, followingIndex: 1, status: 'accepted' }, // John → Jane
  { followerIndex: 0, followingIndex: 3, status: 'accepted' }, // John → Sarah
  
  // Jane's follows
  { followerIndex: 1, followingIndex: 0, status: 'accepted' }, // Jane → John
  { followerIndex: 1, followingIndex: 3, status: 'accepted' }, // Jane → Sarah
  { followerIndex: 1, followingIndex: 2, status: 'pending' },  // Jane → Mike (pending)
  
  // Sarah's follows
  { followerIndex: 3, followingIndex: 0, status: 'accepted' }, // Sarah → John
  { followerIndex: 3, followingIndex: 1, status: 'accepted' }, // Sarah → Jane
  
  // Mike's follows
  { followerIndex: 2, followingIndex: 0, status: 'accepted' }, // Mike → John
];
