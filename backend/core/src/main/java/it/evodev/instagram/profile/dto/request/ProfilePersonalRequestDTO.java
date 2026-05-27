package it.evodev.instagram.profile.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfilePersonalRequestDTO {

    @NotBlank(message = "Username is required")
    @Size(max = 32, message = "Username must be at most 32 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._]+$", message = "Username can only contain letters, numbers, dots and underscores")
    private String username;

    @JsonProperty("full_name")
    @Size(max = 64, message = "Full name must be at most 64 characters")
    private String fullName;
}
