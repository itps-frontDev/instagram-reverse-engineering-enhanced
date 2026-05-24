package it.evodev.instagram.directs.repositories;

import it.evodev.instagram.directs.models.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageJpaRepository extends JpaRepository<Message, UUID> {

    List<Message> findByChatIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(UUID chatId, Pageable pageable);
}
