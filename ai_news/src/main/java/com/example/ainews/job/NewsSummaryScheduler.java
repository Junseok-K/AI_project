package com.example.ainews.job;

import com.example.ainews.domain.SummarySlot;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NewsSummaryScheduler {
    private final NewsSummaryJob newsSummaryJob;

    public NewsSummaryScheduler(NewsSummaryJob newsSummaryJob) {
        this.newsSummaryJob = newsSummaryJob;
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Seoul")
    public void morning() {
        newsSummaryJob.run(SummarySlot.MORNING);
    }

    @Scheduled(cron = "0 30 12 * * *", zone = "Asia/Seoul")
    public void lunch() {
        newsSummaryJob.run(SummarySlot.LUNCH);
    }

    @Scheduled(cron = "0 0 21 * * *", zone = "Asia/Seoul")
    public void evening() {
        newsSummaryJob.run(SummarySlot.EVENING);
    }
}
