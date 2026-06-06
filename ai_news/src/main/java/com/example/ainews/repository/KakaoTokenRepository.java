package com.example.ainews.repository;

import com.example.ainews.domain.KakaoToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KakaoTokenRepository extends JpaRepository<KakaoToken, Long> {
    Optional<KakaoToken> findByOwnerKey(String ownerKey);
}
