package com.example.ainews.message;

import com.example.ainews.config.KakaoProperties;
import com.example.ainews.domain.KakaoToken;
import com.example.ainews.repository.KakaoTokenRepository;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class KakaoTokenService {
    public static final String DEFAULT_OWNER_KEY = "me";
    private final KakaoTokenRepository tokenRepository;
    private final KakaoProperties properties;
    private final WebClient webClient;

    public KakaoTokenService(KakaoTokenRepository tokenRepository, KakaoProperties properties, WebClient.Builder webClientBuilder) {
        this.tokenRepository = tokenRepository;
        this.properties = properties;
        this.webClient = webClientBuilder.build();
    }

    @Transactional
    public String validAccessToken(String ownerKey) {
        KakaoToken token = tokenRepository.findByOwnerKey(ownerKey)
                .orElseThrow(() -> new IllegalStateException("Kakao token is not registered for ownerKey=" + ownerKey));
        if (token.getAccessTokenExpiresAt() == null || token.getAccessTokenExpiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return token.getAccessToken();
        }

        KakaoRefreshResponse response = webClient.post()
                .uri(properties.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "refresh_token")
                        .with("client_id", properties.getClientId())
                        .with("refresh_token", token.getRefreshToken()))
                .retrieve()
                .bodyToMono(KakaoRefreshResponse.class)
                .block();
        if (response == null || response.access_token() == null) {
            throw new IllegalStateException("Kakao token refresh response is empty");
        }
        token.updateAccessToken(response.access_token(), Instant.now().plusSeconds(response.expires_in()));
        if (response.refresh_token() != null && !response.refresh_token().isBlank()) {
            token.updateRefreshToken(response.refresh_token());
        }
        return token.getAccessToken();
    }

    private record KakaoRefreshResponse(String access_token, String refresh_token, long expires_in) {
    }
}
