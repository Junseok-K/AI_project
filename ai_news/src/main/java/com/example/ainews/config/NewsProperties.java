package com.example.ainews.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "news")
public class NewsProperties {

    @Positive
    private int maxSearchDisplay = 20;

    @Positive
    private int maxArticleChars = 4000;

    @Positive
    private int maxKakaoMessageChars = 900;

    @Valid
    private List<Category> categories = new ArrayList<>();

    public int getMaxSearchDisplay() {
        return maxSearchDisplay;
    }

    public void setMaxSearchDisplay(int maxSearchDisplay) {
        this.maxSearchDisplay = maxSearchDisplay;
    }

    public int getMaxArticleChars() {
        return maxArticleChars;
    }

    public void setMaxArticleChars(int maxArticleChars) {
        this.maxArticleChars = maxArticleChars;
    }

    public int getMaxKakaoMessageChars() {
        return maxKakaoMessageChars;
    }

    public void setMaxKakaoMessageChars(int maxKakaoMessageChars) {
        this.maxKakaoMessageChars = maxKakaoMessageChars;
    }

    public List<Category> getCategories() {
        return categories;
    }

    public void setCategories(List<Category> categories) {
        this.categories = categories;
    }

    public static class Category {
        @NotBlank
        private String name;
        private List<String> keywords = new ArrayList<>();

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getKeywords() {
            return keywords;
        }

        public void setKeywords(List<String> keywords) {
            this.keywords = keywords;
        }
    }
}
