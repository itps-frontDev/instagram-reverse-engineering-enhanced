package it.evodev.instagram.profile.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ProfileSecurityUpdateRequestDTO {

    @Nullable
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must be at most 255 characters")
    private String email;
    private boolean emailPresent;

    @Nullable
    @JsonProperty("phoneNumber")
    @JsonAlias("phone_number")
    @Pattern(regexp = "^[\\d\\s\\-+()]+$", message = "Phone number can only contain digits, spaces, +, -, (, )")
    @Size(max = 15, message = "Phone number must be at most 15 characters")
    private String phoneNumber;
    private boolean phoneNumberPresent;

    @Nullable
    @JsonProperty("currentPassword")
    @JsonAlias("current_password")
    private String currentPassword;
    private boolean currentPasswordPresent;

    @Nullable
    @JsonProperty("newPassword")
    @JsonAlias("new_password")
    @Size(min = 6, message = "New password must be at least 6 characters")
    private String newPassword;
    private boolean newPasswordPresent;

    public void setEmail(String email) {
        this.email = email;
        this.emailPresent = true;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.phoneNumberPresent = true;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
        this.currentPasswordPresent = true;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
        this.newPasswordPresent = true;
    }
}
