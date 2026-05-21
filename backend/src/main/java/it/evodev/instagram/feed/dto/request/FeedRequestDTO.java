package it.evodev.instagram.feed.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedRequestDTO {
    private Integer limit;
    private Integer offset;
}
