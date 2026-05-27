package it.evodev.instagram.follow.events;

public record FollowCreatedEvent(Long senderProfileId, Long recipientProfileId) {}
