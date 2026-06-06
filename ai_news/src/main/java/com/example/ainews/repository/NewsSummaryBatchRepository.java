package com.example.ainews.repository;

import com.example.ainews.domain.NewsSummaryBatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsSummaryBatchRepository extends JpaRepository<NewsSummaryBatch, Long> {
}
