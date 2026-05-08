package it.evodev.instagram.auth.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "profiles")
@Getter
@Setter
public class ProfileModel {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;

    @Column(name = "username", nullable = false, columnDefinition = "citext")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
