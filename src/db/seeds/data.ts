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
  {
    email: 'alex@example.com',
    phone_number: '+1234567894',
    password: 'password123',
    date_of_birth: '1993-07-12',
  },
  {
    email: 'emma@example.com',
    phone_number: '+1234567895',
    password: 'password123',
    date_of_birth: '1996-09-08',
  },
  {
    email: 'david@example.com',
    phone_number: '+1234567896',
    password: 'password123',
    date_of_birth: '1991-02-28',
  },
  {
    email: 'lisa@example.com',
    phone_number: '+1234567897',
    password: 'password123',
    date_of_birth: '1994-12-05',
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
  {
    username: 'alextravel',
    full_name: 'Alex Rodriguez',
    bio: 'World traveler 🌍\nAdventure seeker\n150+ countries visited',
    website_url: 'https://alextravel.blog',
    is_private: false,
    is_verified: true,
  },
  {
    username: 'emmafood',
    full_name: 'Emma Wilson',
    bio: 'Food blogger 🍕\nRecipe creator\nDM for collabs',
    website_url: 'https://emmacooks.com',
    is_private: false,
    is_verified: false,
  },
  {
    username: 'davidtech',
    full_name: 'David Chen',
    bio: 'Tech enthusiast 💻\nSoftware engineer\nBuilding the future',
    website_url: 'https://davidchen.dev',
    is_private: false,
    is_verified: true,
  },
  {
    username: 'lisamusic',
    full_name: 'Lisa Anderson',
    bio: 'Musician 🎵\nSinger-songwriter\nNew album out now!',
    website_url: 'https://lisamusic.com',
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

  // Jane's stories (4 stories)
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
  {
    profileIndex: 1,
    media_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1080&h=1920&fit=crop',
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

  // Alex's stories (4 stories)
  {
    profileIndex: 4,
    media_url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 4,
    media_url: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 4,
    media_url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 4,
    media_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // Emma's stories (3 stories)
  {
    profileIndex: 5,
    media_url: 'https://images.unsplash.com/photo-1502301197179-65228ab57f78?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 5,
    media_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 5,
    media_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // David's stories (4 stories)
  {
    profileIndex: 6,
    media_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 6,
    media_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 6,
    media_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 6,
    media_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },

  // Lisa's stories (3 stories)
  {
    profileIndex: 7,
    media_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 7,
    media_url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=1080&h=1920&fit=crop',
    media_type: 'image',
    duration_seconds: 5,
  },
  {
    profileIndex: 7,
    media_url: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=1080&h=1920&fit=crop',
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
  { followerIndex: 0, followingIndex: 4, status: 'accepted' }, // John → Alex
  { followerIndex: 0, followingIndex: 5, status: 'accepted' }, // John → Emma
  
  // Jane's follows
  { followerIndex: 1, followingIndex: 0, status: 'accepted' }, // Jane → John
  { followerIndex: 1, followingIndex: 3, status: 'accepted' }, // Jane → Sarah
  { followerIndex: 1, followingIndex: 2, status: 'pending' },  // Jane → Mike (pending)
  { followerIndex: 1, followingIndex: 6, status: 'accepted' }, // Jane → David
  
  // Sarah's follows
  { followerIndex: 3, followingIndex: 0, status: 'accepted' }, // Sarah → John
  { followerIndex: 3, followingIndex: 1, status: 'accepted' }, // Sarah → Jane
  { followerIndex: 3, followingIndex: 7, status: 'accepted' }, // Sarah → Lisa
  
  // Mike's follows
  { followerIndex: 2, followingIndex: 0, status: 'accepted' }, // Mike → John
  
  // Alex's follows
  { followerIndex: 4, followingIndex: 0, status: 'accepted' }, // Alex → John
  { followerIndex: 4, followingIndex: 1, status: 'accepted' }, // Alex → Jane
  { followerIndex: 4, followingIndex: 5, status: 'accepted' }, // Alex → Emma
  
  // Emma's follows
  { followerIndex: 5, followingIndex: 0, status: 'accepted' }, // Emma → John
  { followerIndex: 5, followingIndex: 4, status: 'accepted' }, // Emma → Alex
  { followerIndex: 5, followingIndex: 7, status: 'accepted' }, // Emma → Lisa
  
  // David's follows
  { followerIndex: 6, followingIndex: 1, status: 'accepted' }, // David → Jane
  { followerIndex: 6, followingIndex: 3, status: 'accepted' }, // David → Sarah
  
  // Lisa's follows
  { followerIndex: 7, followingIndex: 3, status: 'accepted' }, // Lisa → Sarah
  { followerIndex: 7, followingIndex: 5, status: 'accepted' }, // Lisa → Emma
];
