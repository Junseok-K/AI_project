package com.example.ainews.job;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.ainews.config.NewsProperties;
import com.example.ainews.domain.NewsSummaryBatch;
import com.example.ainews.domain.SummarySlot;
import com.example.ainews.message.DeliveryLogService;
import com.example.ainews.message.MessageDeliveryRequest;
import com.example.ainews.message.MessageDeliveryResult;
import com.example.ainews.message.MessageSender;
import com.example.ainews.news.NewsArticleCollector;
import com.example.ainews.repository.NewsArticleRepository;
import com.example.ainews.repository.NewsSummaryBatchRepository;
import com.example.ainews.repository.NewsSummaryItemRepository;
import com.example.ainews.summary.IssueClusterService;
import com.example.ainews.summary.SummaryGenerator;
import com.example.ainews.summary.SummaryMessageSplitter;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;

class NewsSummaryJobTest {

    @Test
    void runSendsGeneratedSummaryThroughMessageSender() {
        Clock clock = Clock.fixed(Instant.parse("2026-06-03T03:30:00Z"), ZoneId.of("Asia/Seoul"));
        NewsProperties properties = new NewsProperties();
        properties.setMaxKakaoMessageChars(1000);
        NewsArticleCollector collector = mock(NewsArticleCollector.class);
        NewsArticleRepository articleRepository = mock(NewsArticleRepository.class);
        NewsSummaryBatchRepository batchRepository = mock(NewsSummaryBatchRepository.class);
        NewsSummaryItemRepository itemRepository = mock(NewsSummaryItemRepository.class);
        IssueClusterService issueClusterService = mock(IssueClusterService.class);
        SummaryGenerator summaryGenerator = mock(SummaryGenerator.class);
        MessageSender messageSender = mock(MessageSender.class);
        DeliveryLogService deliveryLogService = mock(DeliveryLogService.class);

        when(batchRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0, NewsSummaryBatch.class));
        when(collector.collectConfiguredCategories()).thenReturn(List.of());
        when(articleRepository.findByPubDateBetweenOrderByPubDateDesc(any(), any())).thenReturn(List.of());
        when(summaryGenerator.generate(SummarySlot.LUNCH, List.of())).thenReturn("[점심 브리핑]\n테스트");
        when(messageSender.send(any())).thenReturn(MessageDeliveryResult.ok());
        when(messageSender.channel()).thenReturn("KAKAO_MEMO");

        NewsSummaryJob job = new NewsSummaryJob(clock, properties, collector, articleRepository, batchRepository,
                itemRepository, issueClusterService, summaryGenerator, new SummaryMessageSplitter(),
                messageSender, deliveryLogService);

        job.run(SummarySlot.LUNCH);

        verify(messageSender).send(new MessageDeliveryRequest("me", "[점심 브리핑]\n테스트"));
        verify(deliveryLogService).record(any(), any(), any(), any());
    }
}
