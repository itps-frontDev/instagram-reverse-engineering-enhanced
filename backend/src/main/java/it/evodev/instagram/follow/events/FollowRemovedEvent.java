package it.evodev.instagram.follow.events;

public record FollowRemovedEvent(Long senderProfileId, Long recipientProfileId) {}
