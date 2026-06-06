package com.example.ainews.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "news_summary_items")
public class NewsSummaryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private NewsSummaryBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private NewsArticle article;

    @Column(nullable = false)
    private String category;

    @Column(length = 1200)
    private String summary;

    private int sourceCount;

    protected NewsSummaryItem() {
    }

    public NewsSummaryItem(NewsSummaryBatch batch, NewsArticle article, String category, String summary, int sourceCount) {
        this.batch = batch;
        this.article = article;
        this.category = category;
        this.summary = summary;
        this.sourceCount = sourceCount;
    }
}
