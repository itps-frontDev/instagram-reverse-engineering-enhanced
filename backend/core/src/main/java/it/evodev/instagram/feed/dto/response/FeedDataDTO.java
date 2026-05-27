package it.evodev.instagram.feed.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class FeedDataDTO {
    private List<FeedPostDTO> posts;
    private String nextCursor;
    private boolean hasMore;
}
