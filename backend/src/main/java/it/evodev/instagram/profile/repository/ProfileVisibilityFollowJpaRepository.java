package it.evodev.instagram.profile.repository;

import it.evodev.instagram.profile.model.ProfileVisibilityFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileVisibilityFollowJpaRepository extends JpaRepository<ProfileVisibilityFollow, Long> {
    Optional<ProfileVisibilityFollow> findByFollowerProfileIdAndFollowingProfileIdAndDeletedAtIsNull(Long followerProfileId, Long followingProfileId);
}
