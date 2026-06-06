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
@Table(name = "subscribers")
public class Subscriber {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String externalUserKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriberStatus status = SubscriberStatus.ACTIVE;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Subscriber() {
    }

    public Subscriber(String externalUserKey) {
        this.externalUserKey = externalUserKey;
    }
}
