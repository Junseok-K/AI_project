package com.example.ainews.news;

import java.time.Duration;
import java.util.Comparator;
import java.util.Optional;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class JsoupArticleContentExtractor implements ArticleContentExtractor {
    private static final int MIN_TEXT_LENGTH = 300;

    @Override
    public Optional<String> extract(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        try {
            Document document = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 ai-news-batch")
                    .timeout((int) Duration.ofSeconds(5).toMillis())
                    .get();

            Optional<String> articleText = document.select("article, #articleBody, .article_body, .newsct_article, .article-view")
                    .stream()
                    .map(Element::text)
                    .filter(text -> text.length() >= MIN_TEXT_LENGTH)
                    .max(Comparator.comparingInt(String::length));

            String text = articleText.orElseGet(() -> document.body() == null ? "" : document.body().text());
            text = text.replaceAll("\\s+", " ").trim();
            return text.length() >= 80 ? Optional.of(text) : Optional.empty();
        } catch (Exception ex) {
            return Optional.empty();
        }
    }
}
