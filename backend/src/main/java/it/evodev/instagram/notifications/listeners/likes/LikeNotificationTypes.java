package it.evodev.instagram.notifications.listeners.likes;

import it.evodev.instagram.likes.models.enums.LikeableType;

record LikeNotificationTypes(String type, String referenceType) {

    static LikeNotificationTypes from(LikeableType likeableType) {
        return switch (likeableType) {
            case POST -> new LikeNotificationTypes("like_post", "post");
            case COMMENT -> new LikeNotificationTypes("like_comment", "comment");
            case STORY -> new LikeNotificationTypes("like_story", "story");
        };
    }
}
