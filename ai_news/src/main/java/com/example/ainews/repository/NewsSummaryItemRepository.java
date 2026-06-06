package com.example.ainews.repository;

import com.example.ainews.domain.NewsSummaryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsSummaryItemRepository extends JpaRepository<NewsSummaryItem, Long> {
}
