package com.example.ainews.repository;

import com.example.ainews.domain.DeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryLogRepository extends JpaRepository<DeliveryLog, Long> {
}
