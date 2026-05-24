package it.evodev.instagram.directs.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_participants")
@Getter
@Setter
@NoArgsConstructor
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "chat_id", nullable = false, columnDefinition = "uuid")
    private UUID chatId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "is_muted", nullable = false)
    private Boolean isMuted;

    @Column(name = "last_read_message_id", columnDefinition = "uuid")
    private UUID lastReadMessageId;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;
}
