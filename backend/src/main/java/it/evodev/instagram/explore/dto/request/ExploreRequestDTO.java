package it.evodev.instagram.explore.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExploreRequestDTO {
    private Integer limit;
    private Integer offset;
}

