package it.evodev.instagram.auth.models;

import com.fatellicaterinasrl.fatellisync.auth.models.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "users", schema = "staging")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "users_seq")
    @SequenceGenerator(name = "users_seq", sequenceName = "users_id_seq", allocationSize = 1, schema = "staging")
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String displayName;

    @Column(nullable = false, length = 72)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.OPERATOR;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(nullable = false)
    private Boolean locked = false;

    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;

    @Column
    private LocalDateTime lockedUntil;

    @Column
    private LocalDateTime lastLoginAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
