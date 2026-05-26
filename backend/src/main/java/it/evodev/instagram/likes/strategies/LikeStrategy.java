package it.evodev.instagram.likes.strategies;

import it.evodev.instagram.likes.models.enums.LikeableType;

public interface LikeStrategy {
    LikeableType supportedType();

    void validateExists(Long likeableId);

    void validateCanAccess(Long requesterProfileId, Long likeableId);

    void adjustCount(Long likeableId, int delta);

    long getCount(Long likeableId);

    Long resolveAuthorProfileId(Long likeableId);
}
