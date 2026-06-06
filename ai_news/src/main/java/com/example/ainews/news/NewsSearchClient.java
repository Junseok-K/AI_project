package com.example.ainews.news;

import java.util.List;

public interface NewsSearchClient {
    List<NewsSearchResult> search(String category, String keyword, int display);
}
