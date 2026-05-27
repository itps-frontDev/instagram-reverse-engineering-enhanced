package it.evodev.instagram.auth.util;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

public final class UuidV7Generator {

    private static final char[] VARIANT_NIBBLES = {'8', '9', 'a', 'b'};

    private UuidV7Generator() {
    }

    public static UUID generate() {
        long epochMillis = Instant.now().toEpochMilli();
        String tsHex = String.format("%012x", epochMillis);
        int randA = ThreadLocalRandom.current().nextInt(0x1000);
        String randAHex = String.format("%03x", randA);

        long randBLow = ThreadLocalRandom.current().nextLong();
        String randBHex = String.format("%016x", randBLow);
        randBHex = randBHex.substring(1);

        char variant = VARIANT_NIBBLES[ThreadLocalRandom.current().nextInt(VARIANT_NIBBLES.length)];
        String uuidText = tsHex.substring(0, 8)
                + "-"
                + tsHex.substring(8, 12)
                + "-"
                + "7"
                + randAHex
                + "-"
                + variant
                + randBHex.substring(0, 3)
                + "-"
                + randBHex.substring(3, 15);

        return UUID.fromString(uuidText);
    }
}
