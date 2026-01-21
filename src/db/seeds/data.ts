/**
 * @fileoverview Dati di test per il seeding
 *
 * Contiene tutti i dati di test organizzati per entità.
 * Modifica questo file per aggiungere o aggiornare utenti, post e altri dataset.
 */

// ============================================================================
// GENERATORI DI DATI
// ============================================================================

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Sofia', 'Jackson', 'Avery',
  'Sebastian', 'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe',
  'Samuel', 'Victoria', 'Joseph', 'Riley', 'John', 'Aria', 'David', 'Lily',
  'Wyatt', 'Aubrey', 'Carter', 'Zoey', 'Jayden', 'Penelope', 'Luke', 'Lillian',
  'Gabriel', 'Addison', 'Anthony', 'Jane', 'Mike', 'Sarah', 'Alex', 'Lisa',
  'Chris', 'Rachel', 'Ryan', 'Jessica', 'Tyler', 'Hannah', 'Kevin', 'Nicole'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Doe',
  'Cruz', 'Reyes', 'Cooper', 'Reed', 'Bailey', 'Bell', 'Murphy', 'Morgan'
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
  '✈️ Wanderlust | Making memories',
  '🎭 Actor | Dreamer',
  '🏋️ Gym rat | Protein shakes',
  '👗 Fashion blogger',
  '🍜 Ramen connoisseur',
  '🎸 Musician | Songwriter',
  '🏄 Surf life',
  '🌺 Island vibes only',
  '📝 Content creator',
  '🎪 Life is a circus 🤹',
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
// UTENTI - Genera 80 account (da 55)
// ============================================================================

const NUM_USERS = 80;

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
// PROFILI - 80 profili con foto
// ============================================================================

export const TEST_PROFILES = Array.from({ length: NUM_USERS }, (_, i) => {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const username = generateUsername(firstName, lastName, i);
  const fullName = `${firstName} ${lastName}`;
  
  // 95% degli utenti hanno una foto profilo, solo 5% (circa 4 utenti) senza
  const hasProfilePicture = i >= 4; // Primi 4 utenti senza immagine

  return {
    username,
    full_name: fullName,
    bio: randomBool(0.7) ? randomElement(BIO_TEMPLATES) : null,
    website_url: randomBool(0.3) ? `https://${username}.com` : null,
    is_private: randomBool(0.25), // 25% di profili privati
    is_verified: randomBool(0.15), // 15% di profili verificati
    profile_image_url: hasProfilePicture ? `https://i.pravatar.cc/300?u=${username}` : null,
  };
});

// ============================================================================
// POST - Template caption (ampliati)
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
  'Chasing sunsets 🌅',
  'Adventure awaits',
  'Feeling blessed 🙏',
  'Life is beautiful',
  'Creating my own sunshine',
  'Just because',
  'No filter needed',
  'Capturing the moment',
  'Living my truth',
  'Here\'s to the good times',
  'Happiness looks good on me',
  'Throwback to this amazing day',
  'New day, new vibes',
  'Exploring hidden gems',
  'Coffee and contemplation ☕',
  'Golden hour magic',
  'Home is where the heart is 💙',
  'Friday feels',
  'Making every second count',
  'This is what happiness looks like',
  'Soaking up the sun',
  'Lost in paradise',
  'Positive vibes only ✨',
  'Dream big, work hard',
  'Collecting moments, not things',
  'Living in the moment',
  'Best day ever!',
  'Nature therapy 🌿',
  'Good food, good mood 🍽️',
  'Workout completed 💪',
  'Self-care Sunday',
  'Travel mode: ON ✈️',
  'City lights and late nights',
  'Beach days are the best days',
  'Sunset state of mind',
  'Art is everywhere 🎨',
  'Music makes everything better 🎵',
  'Foodie life',
  'Just keep swimming 🏊',
  'Hustle and heart',
  'Find me where the wifi is weak',
  'Today was a good day',
];

// Ogni profilo riceve 8-15 post generati dinamicamente nei seeders (valore aumentato)
export const POST_ASSIGNMENTS = Array.from({ length: NUM_USERS }, (_, i) => ({
  profileIndex: i,
  count: randomInt(8, 15), // In precedenza 5-10
}));

// ============================================================================
// STORIE - Con scadenza a 99 anni per le demo
// ============================================================================

// Calcola la data di scadenza tra 99 anni
const STORY_EXPIRATION_DATE = new Date();
STORY_EXPIRATION_DATE.setFullYear(STORY_EXPIRATION_DATE.getFullYear() + 99);
const STORY_EXPIRATION = STORY_EXPIRATION_DATE.toISOString().split('T')[0] + ' 23:59:59';

export const STORY_CONFIG = {
  expiresAt: STORY_EXPIRATION,
  storiesPerProfile: { min: 3, max: 8 }, // Prima 3-6
};

// ============================================================================
// TEMPLATE MESSAGGI
// ============================================================================

export const MESSAGE_TEMPLATES = [
  'Hey! How are you?',
  'Thanks for following! 😊',
  'Love your recent post!',
  'Let\'s catch up soon',
  'That photo is amazing!',
  'What camera do you use?',
  'Where is this place?',
  'Great content!',
  'Haha that\'s so funny 😂',
  'Can\'t wait to see more',
  'This is goals 🔥',
  'Stunning!',
  'You inspire me',
  'Following back! 🙌',
  'Nice to meet you',
  'Do you have any tips?',
  'This made my day',
  'Beautiful shot!',
  'Keep up the great work',
  'Wow just wow',
];

// ============================================================================
// TEMPLATE COMMENTI
// ============================================================================

export const COMMENT_TEMPLATES = [
  'Love this! 😍',
  'Amazing!',
  'So beautiful ❤️',
  'Goals!',
  'Stunning 🔥',
  'This is perfect',
  'Can\'t stop looking at this',
  'Wow! 🤩',
  'Incredible',
  'You\'re killing it!',
  'This is art',
  'Obsessed 💯',
  'Perfection',
  'Need this in my life',
  'So good!',
  'Beautiful capture',
  'Love the vibes',
  'This speaks to me',
  'Absolutely gorgeous',
  'You nailed it!',
  '🔥🔥🔥',
  '💙💙💙',
  '✨✨✨',
  'Yes! 🙌',
  'Epic!',
];

// ============================================================================
// TEMPLATE HASHTAG
// ============================================================================

export const HASHTAG_TEMPLATES = [
  '#instagood', '#photooftheday', '#beautiful', '#happy', '#fashion',
  '#picoftheday', '#art', '#photography', '#love', '#nature',
  '#travel', '#style', '#summer', '#beauty', '#fitness',
  '#food', '#life', '#instadaily', '#instalike', '#follow',
  '#amazing', '#me', '#inspiration', '#lifestyle', '#sunset',
  '#vibes', '#goals', '#mood', '#blessed', '#weekend',
];

// ============================================================================
// TEMPLATE LOCALITÀ
// ============================================================================

export const LOCATION_TEMPLATES = [
  'New York, NY', 'Los Angeles, CA', 'Miami, FL', 'Chicago, IL',
  'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Austin, TX',
  'Las Vegas, NV', 'Portland, OR', 'Denver, CO', 'Nashville, TN',
  'Paris, France', 'London, UK', 'Tokyo, Japan', 'Barcelona, Spain',
  'Rome, Italy', 'Bali, Indonesia', 'Dubai, UAE', 'Sydney, Australia',
];
