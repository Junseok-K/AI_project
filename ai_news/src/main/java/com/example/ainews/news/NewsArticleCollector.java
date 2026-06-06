package com.example.ainews.news;

import com.example.ainews.config.NewsProperties;
import com.example.ainews.domain.NewsArticle;
import com.example.ainews.domain.NewsSource;
import com.example.ainews.repository.NewsArticleRepository;
import com.example.ainews.repository.NewsSourceRepository;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsArticleCollector {
    private final NewsProperties newsProperties;
    private final NewsSearchClient newsSearchClient;
    private final ArticleDeduplicator deduplicator;
    private final ArticleContentExtractor contentExtractor;
    private final NewsArticleRepository articleRepository;
    private final NewsSourceRepository sourceRepository;

    public NewsArticleCollector(NewsProperties newsProperties, NewsSearchClient newsSearchClient,
                                ArticleDeduplicator deduplicator, ArticleContentExtractor contentExtractor,
                                NewsArticleRepository articleRepository, NewsSourceRepository sourceRepository) {
        this.newsProperties = newsProperties;
        this.newsSearchClient = newsSearchClient;
        this.deduplicator = deduplicator;
        this.contentExtractor = contentExtractor;
        this.articleRepository = articleRepository;
        this.sourceRepository = sourceRepository;
    }

    @Transactional
    public List<NewsArticle> collectConfiguredCategories() {
        List<NewsArticle> saved = new ArrayList<>();
        for (NewsProperties.Category category : newsProperties.getCategories()) {
            for (String keyword : category.getKeywords()) {
                List<NewsSearchResult> results = newsSearchClient.search(category.getName(), keyword, newsProperties.getMaxSearchDisplay());
                for (NewsSearchResult result : results) {
                    saveIfNew(result).ifPresent(saved::add);
                }
            }
        }
        return saved;
    }

    private java.util.Optional<NewsArticle> saveIfNew(NewsSearchResult result) {
        String urlHash = deduplicator.urlHash(result.originalLink(), result.link());
        String titleHash = deduplicator.titleHash(result.title());
        if (articleRepository.existsByUrlHashOrNormalizedTitleHash(urlHash, titleHash)) {
            return java.util.Optional.empty();
        }

        NewsSource source = sourceFor(result.originalLink() == null || result.originalLink().isBlank() ? result.link() : result.originalLink());
        NewsArticle article = new NewsArticle(result.category(), result.title(), titleHash, urlHash,
                result.originalLink(), result.link(), result.description(), result.pubDate(), source);
        String url = article.getOriginalLink() == null || article.getOriginalLink().isBlank() ? article.getLink() : article.getOriginalLink();
        String content = contentExtractor.extract(url).orElse(result.description());
        article.updateContent(trim(content, newsProperties.getMaxArticleChars()));
        return java.util.Optional.of(articleRepository.save(article));
    }

    private NewsSource sourceFor(String url) {
        String host = host(url);
        return sourceRepository.findByHost(host)
                .orElseGet(() -> sourceRepository.save(new NewsSource(host, host)));
    }

    private String host(String url) {
        try {
            String host = URI.create(url).getHost();
            if (host == null || host.isBlank()) {
                return "unknown";
            }
            return host.toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
        } catch (Exception ex) {
            return "unknown";
        }
    }

    private String trim(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        return text.length() <= maxChars ? text : text.substring(0, maxChars);
    }
}
