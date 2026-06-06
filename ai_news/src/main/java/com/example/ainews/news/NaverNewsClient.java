package com.example.ainews.news;

import com.example.ainews.config.NaverProperties;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class NaverNewsClient implements NewsSearchClient {
    private final WebClient webClient;
    private final NaverProperties properties;

    public NaverNewsClient(WebClient.Builder webClientBuilder, NaverProperties properties) {
        this.webClient = webClientBuilder.build();
        this.properties = properties;
    }

    @Override
    public List<NewsSearchResult> search(String category, String keyword, int display) {
        NaverNewsResponse response = webClient.get()
                .uri(UriComponentsBuilder.fromUriString(properties.getNewsSearchUri())
                        .queryParam("query", keyword)
                        .queryParam("display", display)
                        .queryParam("sort", "date")
                        .build()
                        .encode()
                        .toUri())
                .header("X-Naver-Client-Id", properties.getClientId())
                .header("X-Naver-Client-Secret", properties.getClientSecret())
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .bodyToMono(NaverNewsResponse.class)
                .block();

        if (response == null || response.items() == null) {
            return List.of();
        }
        return response.items().stream()
                .map(item -> new NewsSearchResult(
                        category,
                        HtmlText.clean(item.title()),
                        item.originallink(),
                        item.link(),
                        HtmlText.clean(item.description()),
                        parsePubDate(item.pubDate())))
                .toList();
    }

    private Instant parsePubDate(String pubDate) {
        return ZonedDateTime.parse(pubDate, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant();
    }

    private record NaverNewsResponse(List<NaverNewsItem> items) {
    }

    private record NaverNewsItem(String title, String originallink, String link, String description, String pubDate) {
    }
}
