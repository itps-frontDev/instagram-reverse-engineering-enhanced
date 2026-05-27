package it.evodev.instagram.follow.events;

public record FollowAcceptedEvent(Long followerProfileId, Long ownerProfileId) {}
