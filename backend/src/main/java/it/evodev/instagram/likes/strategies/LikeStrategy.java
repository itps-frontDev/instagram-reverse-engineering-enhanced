package it.evodev.instagram.likes.strategies;

import it.evodev.instagram.likes.models.enums.LikeableType;

public interface LikeStrategy {
    LikeableType supportedType();

    // TODO: add validateCanAccess(Long profileId, Long likeableId) when post/comment/story
    //  modules are migrated to Spring — enforce visibility rules (private profile, follower-only
    //  stories) at the strategy level before allowing the like toggle.
    void validateExists(Long likeableId);

    void adjustCount(Long likeableId, int delta);

    long getCount(Long likeableId);

    Long resolveAuthorProfileId(Long likeableId);
}
