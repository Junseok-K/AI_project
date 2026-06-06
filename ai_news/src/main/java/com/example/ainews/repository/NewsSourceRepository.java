package com.example.ainews.repository;

import com.example.ainews.domain.NewsSource;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsSourceRepository extends JpaRepository<NewsSource, Long> {
    Optional<NewsSource> findByHost(String host);
}
