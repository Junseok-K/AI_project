package com.example.ainews.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "delivery_logs")
public class DeliveryLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private NewsSummaryBatch batch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    @Column(nullable = false)
    private String channel;

    @Column(nullable = false)
    private String recipientKey;

    @Column(length = 1200)
    private String messagePreview;

    @Column(length = 2000)
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected DeliveryLog() {
    }

    public DeliveryLog(NewsSummaryBatch batch, DeliveryStatus status, String channel, String recipientKey,
                       String messagePreview, String errorMessage) {
        this.batch = batch;
        this.status = status;
        this.channel = channel;
        this.recipientKey = recipientKey;
        this.messagePreview = messagePreview;
        this.errorMessage = errorMessage;
    }
}
