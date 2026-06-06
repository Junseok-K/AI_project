package com.example.ainews.summary;

public record SummaryArticle(
        Long articleId,
        String category,
        String title,
        String content,
        String link,
        int sourceCount
) {
}
