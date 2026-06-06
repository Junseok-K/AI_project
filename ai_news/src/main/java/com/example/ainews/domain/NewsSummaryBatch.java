package com.example.ainews.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "news_summary_batches")
public class NewsSummaryBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SummarySlot slot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BatchStatus status = BatchStatus.RUNNING;

    @Column(nullable = false)
    private Instant windowStart;

    @Column(nullable = false)
    private Instant windowEnd;

    @Column(length = 2000)
    private String errorMessage;

    @Column(nullable = false)
    private Instant startedAt = Instant.now();

    private Instant finishedAt;

    protected NewsSummaryBatch() {
    }

    public NewsSummaryBatch(SummarySlot slot, Instant windowStart, Instant windowEnd) {
        this.slot = slot;
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
    }

    public Long getId() {
        return id;
    }

    public SummarySlot getSlot() {
        return slot;
    }

    public void succeed() {
        this.status = BatchStatus.SUCCESS;
        this.finishedAt = Instant.now();
    }

    public void fail(String errorMessage) {
        this.status = BatchStatus.FAILED;
        this.errorMessage = errorMessage;
        this.finishedAt = Instant.now();
    }
}
