package it.evodev.instagram.explore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ExploreFeedDataDTO {
    private List<ExplorePostDTO> posts;
    private String nextCursor;
    private boolean hasMore;
}

