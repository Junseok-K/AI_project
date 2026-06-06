package com.example.ainews.message;

import com.example.ainews.config.KakaoProperties;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class KakaoMemoSender implements MessageSender {
    private final KakaoTokenService tokenService;
    private final KakaoProperties properties;
    private final WebClient webClient;

    public KakaoMemoSender(KakaoTokenService tokenService, KakaoProperties properties, WebClient.Builder webClientBuilder) {
        this.tokenService = tokenService;
        this.properties = properties;
        this.webClient = webClientBuilder.build();
    }

    @Override
    public MessageDeliveryResult send(MessageDeliveryRequest request) {
        try {
            String accessToken = tokenService.validAccessToken(request.recipientKey());
            Map<String, Object> templateObject = Map.of(
                    "object_type", "text",
                    "text", request.text(),
                    "link", Map.of("web_url", "https://news.naver.com", "mobile_web_url", "https://news.naver.com"),
                    "button_title", "뉴스 보기"
            );
            webClient.post()
                    .uri(properties.getMemoSendUri())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData("template_object", JsonBody.toJson(templateObject)))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return MessageDeliveryResult.ok();
        } catch (Exception ex) {
            return MessageDeliveryResult.failed(ex.getMessage(), true);
        }
    }

    @Override
    public String channel() {
        return "KAKAO_MEMO";
    }
}
