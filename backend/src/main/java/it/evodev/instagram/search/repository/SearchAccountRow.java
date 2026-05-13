package it.evodev.instagram.search.repository;

import java.util.UUID;

public record SearchAccountRow(
        UUID userId,
        String username,
        String fullName,
        String profileImageUrl,
        boolean isVerified,
        boolean isPrivate,
        int followersCount,
        boolean isFollowing
) {
}
