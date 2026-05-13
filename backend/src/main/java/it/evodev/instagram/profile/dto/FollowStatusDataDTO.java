package it.evodev.instagram.profile.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FollowStatusDataDTO {
    @JsonProperty("status")
    private String status;
}
