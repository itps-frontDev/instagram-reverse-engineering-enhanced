package it.evodev.instagram.seed;

import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Profile("dev")
public class SeedData {

    public static final int NUM_USERS    = 80;
    public static final int TARGET_REELS = 20;

    // Istanza condivisa tra tutti i seeder: la sequenza rimane deterministica
    // finché i seeder vengono invocati sempre nello stesso ordine dall'orchestratore.
    final Random rng = new Random(42);

    // ── HELPERS ──────────────────────────────────────────────────────────────

    public <T> T pick(List<T> list) {
        return list.get(rng.nextInt(list.size()));
    }

    public boolean chance(double probability) {
        return rng.nextDouble() < probability;
    }

    public int nextInt(int bound) {
        return rng.nextInt(bound);
    }

    public double nextDouble() {
        return rng.nextDouble();
    }

    public boolean nextBoolean() {
        return rng.nextBoolean();
    }

    public Map<Long, Set<Long>> buildFollowMap(JdbcTemplate jdbc) {
        Map<Long, Set<Long>> map = new HashMap<>();
        jdbc.query(
            "SELECT follower_profile_id, following_profile_id" +
            " FROM follows WHERE status = 'accepted' AND deleted_at IS NULL",
            (RowCallbackHandler) rs -> map
                .computeIfAbsent(rs.getLong("follower_profile_id"), k -> new HashSet<>())
                .add(rs.getLong("following_profile_id"))
        );
        return map;
    }

    // ── COSTANTI ─────────────────────────────────────────────────────────────

    public static final List<String> FIRST_NAMES = List.of(
        "Emma","Liam","Olivia","Noah","Ava","Ethan","Sophia","Mason",
        "Isabella","William","Mia","James","Charlotte","Benjamin","Amelia",
        "Lucas","Harper","Henry","Evelyn","Alexander","Abigail","Michael",
        "Emily","Daniel","Elizabeth","Matthew","Sofia","Jackson","Avery",
        "Sebastian","Ella","Jack","Scarlett","Aiden","Grace","Owen","Chloe",
        "Samuel","Victoria","Joseph","Riley","John","Aria","David","Lily",
        "Wyatt","Aubrey","Carter","Zoey","Jayden","Penelope","Luke","Lillian",
        "Gabriel","Addison","Anthony","Jane","Mike","Sarah","Alex","Lisa",
        "Chris","Rachel","Ryan","Jessica","Tyler","Hannah","Kevin","Nicole"
    );

    public static final List<String> LAST_NAMES = List.of(
        "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
        "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
        "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
        "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
        "Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
        "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell",
        "Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Doe",
        "Cruz","Reyes","Cooper","Reed","Bailey","Bell","Murphy","Morgan"
    );

    public static final List<String> BIO_TEMPLATES = List.of(
        "Living my best life","Photography enthusiast","Coffee lover | World traveler",
        "Entrepreneur | Goal setter","Creative soul","Fitness addict","Bookworm | Writer",
        "Music is life","Foodie adventures","Plant parent","Dog mom/dad","Film buff",
        "Adventure seeker","Mindfulness practitioner","Tech enthusiast","Gamer",
        "Spreading positivity","Beach lover","Baking enthusiast","Cyclist",
        "Wanderlust | Making memories","Actor | Dreamer","Gym rat | Protein shakes",
        "Fashion blogger","Ramen connoisseur","Musician | Songwriter",
        "Surf life","Island vibes only","Content creator","Life is a circus"
    );

    public static final List<String> POST_CAPTIONS = List.of(
        "Another beautiful day","Living for moments like these","Grateful for this view",
        "Can't believe this is real","Just vibing","Weekend mood","Making memories",
        "Good times with great people","Chasing sunsets","Adventure awaits",
        "Feeling blessed","Life is beautiful","Creating my own sunshine","Just because",
        "No filter needed","Capturing the moment","Living my truth",
        "Here's to the good times","Happiness looks good on me","Throwback to this amazing day"
    );

    public static final List<String> REEL_CAPTIONS = List.of(
        "Check this out!","POV: Living my best life","This is everything","Wait for it...",
        "Caught on camera","Vibes only","No way this happened!","Golden hour magic",
        "Behind the scenes","Making memories","This view though","Adventure mode: ON",
        "Life update","Mood","Can't stop watching this","A message from the matchwinner",
        "Best day ever!","Saturday vibes","This is art","Pure happiness"
    );

    public static final List<String> VIDEO_URLS = List.of(
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    );

    public static final List<String> COMMENT_TEMPLATES = List.of(
        "Love this!","Amazing!","So beautiful","Goals!","Stunning","This is perfect",
        "Can't stop looking at this","Wow!","Incredible","You're killing it!",
        "This is art","Obsessed","Perfection","Need this in my life","So good!",
        "Beautiful capture","Love the vibes","This speaks to me","Absolutely gorgeous","You nailed it!"
    );

    public static final List<String> MESSAGE_TEMPLATES = List.of(
        "Hey! How are you?","Thanks for following!","Love your recent post!",
        "Let's catch up soon","That photo is amazing!","What camera do you use?",
        "Where is this place?","Great content!","Haha that's so funny",
        "Can't wait to see more","This is goals","Stunning!","You inspire me",
        "Following back!","Nice to meet you","Do you have any tips?",
        "This made my day","Beautiful shot!","Keep up the great work","Wow just wow"
    );

    public static final List<String> EMAIL_DOMAINS = List.of(
        "gmail.com","yahoo.com","outlook.com","icloud.com","example.com"
    );
}
