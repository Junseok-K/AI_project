package com.example.ainews.repository;

import com.example.ainews.domain.NewsArticle;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    boolean existsByUrlHashOrNormalizedTitleHash(String urlHash, String normalizedTitleHash);

    List<NewsArticle> findByPubDateBetweenOrderByPubDateDesc(Instant start, Instant end);

    long countDistinctByNormalizedTitleHashInAndSourceIsNotNull(Collection<String> normalizedTitleHashes);
}
