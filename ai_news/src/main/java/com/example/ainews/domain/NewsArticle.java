package com.example.ainews.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "news_articles", indexes = {
        @Index(name = "ix_news_article_pub_date", columnList = "pubDate"),
        @Index(name = "ix_news_article_category", columnList = "category"),
        @Index(name = "ix_news_article_url_hash", columnList = "urlHash"),
        @Index(name = "ix_news_article_title_hash", columnList = "normalizedTitleHash")
})
public class NewsArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(nullable = false, length = 64)
    private String normalizedTitleHash;

    @Column(nullable = false, length = 64)
    private String urlHash;

    @Column(length = 2000)
    private String originalLink;

    @Column(length = 2000)
    private String link;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Instant pubDate;

    @Column(length = 8000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private NewsSource source;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected NewsArticle() {
    }

    public NewsArticle(String category, String title, String normalizedTitleHash, String urlHash,
                       String originalLink, String link, String description, Instant pubDate, NewsSource source) {
        this.category = category;
        this.title = title;
        this.normalizedTitleHash = normalizedTitleHash;
        this.urlHash = urlHash;
        this.originalLink = originalLink;
        this.link = link;
        this.description = description;
        this.pubDate = pubDate;
        this.source = source;
    }

    public Long getId() {
        return id;
    }

    public String getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getNormalizedTitleHash() {
        return normalizedTitleHash;
    }

    public String getUrlHash() {
        return urlHash;
    }

    public String getOriginalLink() {
        return originalLink;
    }

    public String getLink() {
        return link;
    }

    public String getDescription() {
        return description;
    }

    public Instant getPubDate() {
        return pubDate;
    }

    public String getContent() {
        return content;
    }

    public NewsSource getSource() {
        return source;
    }

    public void updateContent(String content) {
        this.content = content;
    }
}
