package it.evodev.instagram.search.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequestDTO {
    private String q;
    private String type = "account";
    private Integer limit = 20;
}
