package com.example.ainews.job;

import com.example.ainews.config.ClockConfig;
import com.example.ainews.config.NewsProperties;
import com.example.ainews.domain.NewsArticle;
import com.example.ainews.domain.NewsSummaryBatch;
import com.example.ainews.domain.NewsSummaryItem;
import com.example.ainews.domain.SummarySlot;
import com.example.ainews.message.DeliveryLogService;
import com.example.ainews.message.KakaoTokenService;
import com.example.ainews.message.MessageDeliveryRequest;
import com.example.ainews.message.MessageDeliveryResult;
import com.example.ainews.message.MessageSender;
import com.example.ainews.news.NewsArticleCollector;
import com.example.ainews.repository.NewsArticleRepository;
import com.example.ainews.repository.NewsSummaryBatchRepository;
import com.example.ainews.repository.NewsSummaryItemRepository;
import com.example.ainews.summary.IssueClusterService;
import com.example.ainews.summary.SummaryArticle;
import com.example.ainews.summary.SummaryGenerator;
import com.example.ainews.summary.SummaryMessageSplitter;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NewsSummaryJob {
    private static final Logger log = LoggerFactory.getLogger(NewsSummaryJob.class);
    private final Clock clock;
    private final NewsProperties newsProperties;
    private final NewsArticleCollector collector;
    private final NewsArticleRepository articleRepository;
    private final NewsSummaryBatchRepository batchRepository;
    private final NewsSummaryItemRepository itemRepository;
    private final IssueClusterService issueClusterService;
    private final SummaryGenerator summaryGenerator;
    private final SummaryMessageSplitter messageSplitter;
    private final MessageSender messageSender;
    private final DeliveryLogService deliveryLogService;

    public NewsSummaryJob(Clock clock, NewsProperties newsProperties, NewsArticleCollector collector,
                          NewsArticleRepository articleRepository, NewsSummaryBatchRepository batchRepository,
                          NewsSummaryItemRepository itemRepository, IssueClusterService issueClusterService,
                          SummaryGenerator summaryGenerator, SummaryMessageSplitter messageSplitter,
                          MessageSender messageSender, DeliveryLogService deliveryLogService) {
        this.clock = clock;
        this.newsProperties = newsProperties;
        this.collector = collector;
        this.articleRepository = articleRepository;
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
        this.issueClusterService = issueClusterService;
        this.summaryGenerator = summaryGenerator;
        this.messageSplitter = messageSplitter;
        this.messageSender = messageSender;
        this.deliveryLogService = deliveryLogService;
    }

    @Transactional
    public void run(SummarySlot slot) {
        TimeWindow window = timeWindow(slot);
        NewsSummaryBatch batch = batchRepository.save(new NewsSummaryBatch(slot, window.start(), window.end()));
        try {
            List<NewsArticle> newlySaved = collector.collectConfiguredCategories();
            log.info("Collected {} new articles for {}", newlySaved.size(), slot);

            List<NewsArticle> articles = articleRepository.findByPubDateBetweenOrderByPubDateDesc(window.start(), window.end());
            List<SummaryArticle> summaryArticles = toSummaryArticles(articles);
            String message = summaryGenerator.generate(slot, summaryArticles);

            for (SummaryArticle article : summaryArticles) {
                itemRepository.save(new NewsSummaryItem(batch,
                        articles.stream().filter(it -> it.getId().equals(article.articleId())).findFirst().orElseThrow(),
                        article.category(), "", article.sourceCount()));
            }

            // TODO 수신동의 유저 대상 발송 확장 포인트: SubscriberRepository에서 ACTIVE 구독자를 조회해 recipient별 MessageSender를 호출한다.
            for (String chunk : messageSplitter.split(message, newsProperties.getMaxKakaoMessageChars())) {
                MessageDeliveryRequest request = new MessageDeliveryRequest(KakaoTokenService.DEFAULT_OWNER_KEY, chunk);
                MessageDeliveryResult result = messageSender.send(request);
                deliveryLogService.record(batch, messageSender.channel(), request, result);
                if (!result.success()) {
                    log.warn("Message delivery failed. retryable={}, error={}", result.retryable(), result.errorMessage());
                }
            }
            batch.succeed();
        } catch (Exception ex) {
            batch.fail(ex.getMessage());
            log.error("News summary batch failed. slot={}, error={}", slot, ex.getMessage(), ex);
        }
    }

    private List<SummaryArticle> toSummaryArticles(List<NewsArticle> articles) {
        return articles.stream()
                .sorted(Comparator.comparing(NewsArticle::getPubDate).reversed())
                .limit(25)
                .map(article -> new SummaryArticle(
                        article.getId(),
                        article.getCategory(),
                        article.getTitle(),
                        article.getContent() == null || article.getContent().isBlank() ? article.getDescription() : article.getContent(),
                        article.getOriginalLink() == null || article.getOriginalLink().isBlank() ? article.getLink() : article.getOriginalLink(),
                        issueClusterService.sourceCountFor(article, articles)))
                .toList();
    }

    TimeWindow timeWindow(SummarySlot slot) {
        ZonedDateTime now = ZonedDateTime.now(clock).withZoneSameInstant(ClockConfig.SEOUL_ZONE);
        Instant end = now.toInstant();
        LocalDate today = now.toLocalDate();
        Instant start = switch (slot) {
            case MORNING -> now.minusHours(12).toInstant();
            case LUNCH -> atSeoul(today, LocalTime.of(8, 0));
            case EVENING -> atSeoul(today, LocalTime.MIN);
        };
        return new TimeWindow(start, end);
    }

    private Instant atSeoul(LocalDate date, LocalTime time) {
        return LocalDateTime.of(date, time).atZone(ClockConfig.SEOUL_ZONE).toInstant();
    }

    record TimeWindow(Instant start, Instant end) {
    }
}
