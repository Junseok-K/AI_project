package com.example.ainews.news;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ArticleDeduplicatorTest {
    private final ArticleDeduplicator deduplicator = new ArticleDeduplicator();

    @Test
    void urlHashIgnoresQueryStringForSameArticleUrl() {
        String left = deduplicator.urlHash("https://example.com/news/1?utm_source=a", null);
        String right = deduplicator.urlHash("https://example.com/news/1?from=naver", null);

        assertThat(left).isEqualTo(right);
    }

    @Test
    void titleHashNormalizesNoise() {
        String left = deduplicator.titleHash("[속보] AI 반도체 투자 확대!");
        String right = deduplicator.titleHash("AI 반도체 투자 확대");

        assertThat(left).isEqualTo(right);
    }

    @Test
    void similarTitlesHavePositiveSimilarity() {
        double similarity = deduplicator.similarity("정부 AI 반도체 투자 확대", "AI 반도체 투자 확대 발표");

        assertThat(similarity).isGreaterThan(0.4);
    }
}
