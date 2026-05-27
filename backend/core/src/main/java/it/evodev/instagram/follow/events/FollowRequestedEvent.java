package it.evodev.instagram.follow.events;

public record FollowRequestedEvent(Long senderProfileId, Long recipientProfileId) {}
