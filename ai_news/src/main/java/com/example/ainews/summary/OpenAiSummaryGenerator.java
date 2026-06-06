package com.example.ainews.summary;

import com.example.ainews.config.OpenAiProperties;
import com.example.ainews.domain.SummarySlot;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class OpenAiSummaryGenerator implements SummaryGenerator {
    private final WebClient webClient;
    private final OpenAiProperties properties;

    public OpenAiSummaryGenerator(WebClient.Builder webClientBuilder, OpenAiProperties properties) {
        this.webClient = webClientBuilder.build();
        this.properties = properties;
    }

    @Override
    public String generate(SummarySlot slot, List<SummaryArticle> articles) {
        if (articles.isEmpty()) {
            return "[" + slot.title() + "]\n새로 수집된 주요 뉴스가 없습니다.";
        }

        Map<String, Object> request = Map.of(
                "model", properties.getModel(),
                "temperature", 0.2,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt()),
                        Map.of("role", "user", "content", userPrompt(slot, articles))
                )
        );

        OpenAiResponse response = webClient.post()
                .uri(properties.getChatCompletionsUri())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OpenAiResponse.class)
                .block();

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new IllegalStateException("OpenAI summary response is empty");
        }
        return response.choices().getFirst().message().content();
    }

    private String systemPrompt() {
        return """
                너는 한국어 뉴스 브리핑 편집자다. 카카오톡 메시지로 읽기 쉽게 매우 간결하게 작성한다.
                기사에 없는 사실을 추가하지 말고, 정치적 성향 평가나 언론사 신뢰도 점수는 쓰지 않는다.
                각 항목은 제목, 2줄 요약, 원문 링크, 확인 언론사 N곳을 포함한다.
                """;
    }

    private String userPrompt(SummarySlot slot, List<SummaryArticle> articles) {
        StringBuilder builder = new StringBuilder();
        builder.append("브리핑 제목: [").append(slot.title()).append("]\n");
        builder.append("형식:\n🔥 주요 뉴스 TOP 5\n📈 경제\n💻 IT/AI\n🌎 국제\n\n");
        for (SummaryArticle article : articles) {
            builder.append("- category=").append(article.category())
                    .append(", title=").append(article.title())
                    .append(", sourceCount=").append(article.sourceCount())
                    .append(", link=").append(article.link())
                    .append("\ncontent=").append(article.content())
                    .append("\n\n");
        }
        return builder.toString();
    }

    private record OpenAiResponse(List<Choice> choices) {
    }

    private record Choice(Message message) {
    }

    private record Message(String content) {
    }
}
