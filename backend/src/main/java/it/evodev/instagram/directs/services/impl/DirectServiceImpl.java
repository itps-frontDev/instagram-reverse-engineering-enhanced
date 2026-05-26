package it.evodev.instagram.directs.services.impl;

import it.evodev.instagram.directs.dto.responses.ChatSummaryResponseDTO;
import it.evodev.instagram.directs.dto.responses.GetOrCreateChatResponseDTO;
import it.evodev.instagram.directs.dto.responses.MessageResponseDTO;
import it.evodev.instagram.directs.exceptions.DirectForbiddenException;
import it.evodev.instagram.directs.exceptions.DirectNotFoundException;
import it.evodev.instagram.directs.exceptions.DirectValidationException;
import it.evodev.instagram.directs.models.Chat;
import it.evodev.instagram.directs.models.ChatParticipant;
import it.evodev.instagram.directs.models.Message;
import it.evodev.instagram.directs.repositories.ChatJpaRepository;
import it.evodev.instagram.directs.repositories.ChatParticipantJpaRepository;
import it.evodev.instagram.directs.repositories.MessageJpaRepository;
import it.evodev.instagram.directs.repositories.projections.ChatWithDetailsProjection;
import it.evodev.instagram.directs.repositories.projections.MutualFollowerProjection;
import it.evodev.instagram.directs.services.DirectService;
import it.evodev.instagram.profile.models.Profile;
import it.evodev.instagram.profile.repository.ProfileJpaRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DirectServiceImpl implements DirectService {

    private static final Logger logger = LoggerFactory.getLogger(DirectServiceImpl.class);

    private final ChatJpaRepository chatRepository;
    private final ChatParticipantJpaRepository participantRepository;
    private final MessageJpaRepository messageRepository;
    private final ProfileJpaRepository profileRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ─── Read ────────────────────────────────────────────────────────────────

    @Override
    public List<ChatSummaryResponseDTO> getChats(UUID userId) {
        logger.info("getChats: start for userId={}", userId);
        Profile profile = resolveByUserId(userId);

        List<ChatWithDetailsProjection> rawChats = chatRepository.findChatsWithDetails(profile.getId());

        Set<Long> profileIdsWithChat = rawChats.stream()
                .map(ChatWithDetailsProjection::getOtherProfileId)
                .collect(Collectors.toSet());

        List<ChatSummaryResponseDTO> chats = rawChats.stream()
                .map(c -> new ChatSummaryResponseDTO(
                        c.getChatId(),
                        c.getOtherProfileId(),
                        c.getOtherUsername(),
                        c.getOtherFullName(),
                        c.getOtherProfileImageUrl(),
                        c.getLastMessageText(),
                        c.getLastMessageAt(),
                        c.getLastMessageSenderId() != null && c.getLastMessageSenderId().equals(profile.getId())
                ))
                .collect(Collectors.toCollection(ArrayList::new));

        List<MutualFollowerProjection> followers = chatRepository.findMutualFollowersWithoutChat(profile.getId());
        followers.stream()
                .filter(f -> !profileIdsWithChat.contains(f.getId()))
                .map(f -> new ChatSummaryResponseDTO(
                        null,
                        f.getId(),
                        f.getUsername(),
                        f.getFullName(),
                        f.getProfileImageUrl(),
                        null,
                        null,
                        false
                ))
                .forEach(chats::add);

        logger.info("getChats: returning {} chats ({} with messages, {} potential) for profileId={}",
                chats.size(), rawChats.size(), followers.size(), profile.getId());
        return chats;
    }

    @Override
    public List<MessageResponseDTO> getMessages(UUID userId, UUID chatId) {
        logger.info("getMessages: start for userId={}, chatId={}", userId, chatId);
        Profile profile = resolveByUserId(userId);
        assertParticipant(chatId, profile.getId());

        List<MessageResponseDTO> messages = messageRepository
                .findByChatIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(chatId, PageRequest.of(0, 100))
                .stream()
                .map(m -> new MessageResponseDTO(m.getId(), m.getChatId(), m.getSenderProfileId(), m.getText(), m.getCreatedAt()))
                .toList();

        logger.info("getMessages: returning {} messages for chatId={}", messages.size(), chatId);
        return messages;
    }

    // ─── Mutations ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public GetOrCreateChatResponseDTO getOrCreateChat(UUID userId, Long otherProfileId) {
        logger.info("getOrCreateChat: start for userId={}, otherProfileId={}", userId, otherProfileId);
        Profile profile = resolveByUserId(userId);

        if (profile.getId().equals(otherProfileId)) {
            throw new DirectValidationException("Cannot create a chat with yourself");
        }

        if (!profileRepository.existsById(otherProfileId)) {
            throw new DirectNotFoundException("Profile not found: " + otherProfileId);
        }

        Optional<UUID> existing = chatRepository.findExistingDirectChatId(profile.getId(), otherProfileId);
        if (existing.isPresent()) {
            logger.info("getOrCreateChat: found existing chatId={}", existing.get());
            return new GetOrCreateChatResponseDTO(existing.get());
        }

        LocalDateTime now = LocalDateTime.now();

        Chat chat = new Chat();
        chat.setIsGroup(false);
        chat.setCreatedByProfileId(profile.getId());
        chat.setCreatedAt(now);
        chat.setUpdatedAt(now);
        chatRepository.save(chat);

        ChatParticipant self = participant(chat.getId(), profile.getId(), now);
        ChatParticipant other = participant(chat.getId(), otherProfileId, now);
        participantRepository.save(self);
        participantRepository.save(other);

        logger.info("getOrCreateChat: created chatId={} between profileId={} and profileId={}",
                chat.getId(), profile.getId(), otherProfileId);
        return new GetOrCreateChatResponseDTO(chat.getId());
    }

    @Override
    @Transactional
    public MessageResponseDTO sendMessage(UUID userId, UUID chatId, String text) {
        logger.info("sendMessage: start for userId={}, chatId={}", userId, chatId);
        Profile profile = resolveByUserId(userId);
        assertParticipant(chatId, profile.getId());

        if (text == null || text.isBlank()) {
            throw new DirectValidationException("Message text cannot be blank");
        }
        if (text.length() > 1000) {
            throw new DirectValidationException("Message text exceeds 1000 characters");
        }

        LocalDateTime now = LocalDateTime.now();

        Message message = new Message();
        message.setChatId(chatId);
        message.setSenderProfileId(profile.getId());
        message.setText(text);
        message.setCreatedAt(now);
        messageRepository.save(message);

        chatRepository.findById(chatId).ifPresent(chat -> {
            chat.setLastMessageAt(now);
            chat.setUpdatedAt(now);
            chatRepository.save(chat);
        });

        MessageResponseDTO dto = new MessageResponseDTO(
                message.getId(), message.getChatId(), message.getSenderProfileId(),
                message.getText(), message.getCreatedAt());

        // Il broadcast WS viene registrato per DOPO il commit della transazione.
        // Così Hibernate ha già fatto flush dell'INSERT prima che i client ricevano il push
        // ed eventuali re-fetch trovino il messaggio già persistito.
        List<ChatParticipant> participants = participantRepository.findByChatIdAndLeftAtIsNull(chatId);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        for (ChatParticipant p : participants) {
                            profileRepository.findById(p.getProfileId()).ifPresent(participantProfile -> {
                                String targetUserId = participantProfile.getUserId().toString();
                                messagingTemplate.convertAndSendToUser(targetUserId, "/queue/direct", dto);
                            });
                        }
                        logger.info("sendMessage: message {} pushed to {} participants in chatId={}", dto.id(), participants.size(), chatId);
                    }
                });

        return dto;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Profile resolveByUserId(UUID userId) {
        return profileRepository.findByUserIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new DirectNotFoundException("User profile not found for userId: " + userId));
    }

    private void assertParticipant(UUID chatId, Long profileId) {
        if (!participantRepository.existsByChatIdAndProfileIdAndLeftAtIsNull(chatId, profileId)) {
            logger.warn("assertParticipant: profileId={} is not a participant of chatId={}", profileId, chatId);
            throw new DirectForbiddenException("Not a participant of this chat");
        }
    }

    private ChatParticipant participant(UUID chatId, Long profileId, LocalDateTime now) {
        ChatParticipant p = new ChatParticipant();
        p.setChatId(chatId);
        p.setProfileId(profileId);
        p.setRole("member");
        p.setIsMuted(false);
        p.setJoinedAt(now);
        return p;
    }
}
