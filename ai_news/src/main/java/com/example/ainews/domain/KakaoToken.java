package com.example.ainews.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "kakao_tokens")
public class KakaoToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ownerKey;

    @Column(nullable = false, length = 2000)
    private String accessToken;

    @Column(nullable = false, length = 2000)
    private String refreshToken;

    private Instant accessTokenExpiresAt;

    protected KakaoToken() {
    }

    public KakaoToken(String ownerKey, String accessToken, String refreshToken, Instant accessTokenExpiresAt) {
        this.ownerKey = ownerKey;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.accessTokenExpiresAt = accessTokenExpiresAt;
    }

    public String getOwnerKey() {
        return ownerKey;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public Instant getAccessTokenExpiresAt() {
        return accessTokenExpiresAt;
    }

    public void updateAccessToken(String accessToken, Instant accessTokenExpiresAt) {
        this.accessToken = accessToken;
        this.accessTokenExpiresAt = accessTokenExpiresAt;
    }

    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
