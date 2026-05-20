package it.evodev.instagram.follow.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionDTO {
    private Long id;
    private String username;
    private String fullName;
    private String profileImageUrl;
    private Integer followersCount;
}
