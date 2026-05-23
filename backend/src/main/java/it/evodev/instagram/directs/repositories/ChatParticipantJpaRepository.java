package it.evodev.instagram.directs.repositories;

import it.evodev.instagram.directs.models.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatParticipantJpaRepository extends JpaRepository<ChatParticipant, Long> {

    List<ChatParticipant> findByChatIdAndLeftAtIsNull(UUID chatId);

    boolean existsByChatIdAndProfileIdAndLeftAtIsNull(UUID chatId, Long profileId);
}
