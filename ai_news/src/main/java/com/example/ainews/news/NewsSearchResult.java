package com.example.ainews.news;

import java.time.Instant;

public record NewsSearchResult(
        String category,
        String title,
        String originalLink,
        String link,
        String description,
        Instant pubDate
) {
}
