package com.example.ainews.summary;

import com.example.ainews.domain.NewsArticle;
import com.example.ainews.news.ArticleDeduplicator;
import java.util.Collection;
import java.util.HashSet;
import org.springframework.stereotype.Service;

@Service
public class IssueClusterService {
    private static final double SAME_ISSUE_THRESHOLD = 0.45;
    private final ArticleDeduplicator deduplicator;

    public IssueClusterService(ArticleDeduplicator deduplicator) {
        this.deduplicator = deduplicator;
    }

    public int sourceCountFor(NewsArticle target, Collection<NewsArticle> articles) {
        HashSet<String> sourceHosts = new HashSet<>();
        for (NewsArticle article : articles) {
            if (deduplicator.similarity(target.getTitle(), article.getTitle()) >= SAME_ISSUE_THRESHOLD) {
                String host = article.getSource() == null ? "unknown" : article.getSource().getHost();
                sourceHosts.add(host);
            }
        }
        return Math.max(1, sourceHosts.size());
    }
}
