package it.evodev.instagram.reels.repositories;

import it.evodev.instagram.reels.models.ReelPostMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReelPostMediaJpaRepository extends JpaRepository<ReelPostMedia, Long> {

    List<ReelPostMedia> findByPostIdInAndDeletedAtIsNullOrderByPosition(List<Long> postIds);
}
