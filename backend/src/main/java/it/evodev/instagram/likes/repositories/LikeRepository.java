package it.evodev.instagram.likes.repositories;

import it.evodev.instagram.likes.models.Like;
import it.evodev.instagram.likes.models.enums.LikeableType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    Optional<Like> findByProfileIdAndLikeableTypeAndLikeableId(
            Long profileId, LikeableType likeableType, Long likeableId);
}
