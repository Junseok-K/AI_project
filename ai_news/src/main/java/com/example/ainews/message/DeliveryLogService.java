package com.example.ainews.message;

import com.example.ainews.domain.DeliveryLog;
import com.example.ainews.domain.DeliveryStatus;
import com.example.ainews.domain.NewsSummaryBatch;
import com.example.ainews.repository.DeliveryLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeliveryLogService {
    private final DeliveryLogRepository deliveryLogRepository;

    public DeliveryLogService(DeliveryLogRepository deliveryLogRepository) {
        this.deliveryLogRepository = deliveryLogRepository;
    }

    @Transactional
    public void record(NewsSummaryBatch batch, String channel, MessageDeliveryRequest request, MessageDeliveryResult result) {
        DeliveryStatus status = result.success()
                ? DeliveryStatus.SUCCESS
                : (result.retryable() ? DeliveryStatus.RETRYABLE : DeliveryStatus.FAILED);
        deliveryLogRepository.save(new DeliveryLog(batch, status, channel, request.recipientKey(),
                preview(request.text()), result.errorMessage()));
    }

    private String preview(String text) {
        if (text == null) {
            return "";
        }
        return text.length() <= 1000 ? text : text.substring(0, 1000);
    }
}
