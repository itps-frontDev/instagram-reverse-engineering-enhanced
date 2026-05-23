package it.evodev.instagram.directs.services;

import it.evodev.instagram.directs.dto.responses.ChatSummaryResponseDTO;
import it.evodev.instagram.directs.dto.responses.GetOrCreateChatResponseDTO;
import it.evodev.instagram.directs.dto.responses.MessageResponseDTO;

import java.util.List;
import java.util.UUID;

public interface DirectService {

    List<ChatSummaryResponseDTO> getChats(UUID userId);

    List<MessageResponseDTO> getMessages(UUID userId, UUID chatId);

    GetOrCreateChatResponseDTO getOrCreateChat(UUID userId, Long otherProfileId);

    MessageResponseDTO sendMessage(UUID userId, UUID chatId, String text);
}
