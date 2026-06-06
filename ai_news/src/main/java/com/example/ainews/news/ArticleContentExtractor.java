package com.example.ainews.news;

import java.util.Optional;

public interface ArticleContentExtractor {
    Optional<String> extract(String url);
}
