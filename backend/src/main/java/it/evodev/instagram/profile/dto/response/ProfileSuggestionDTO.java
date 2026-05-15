package it.evodev.instagram.profile.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileSuggestionDTO {
    private Long id;
    private String username;
    
    @JsonProperty("fullName")
    private String fullName;
    
    @JsonProperty("profileImageUrl")
    private String profileImageUrl;
    
    @JsonProperty("followersCount")
    private Integer followersCount;
}
