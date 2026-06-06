package com.example.ainews.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "naver")
public class NaverProperties {
    private String clientId;
    private String clientSecret;
    private String newsSearchUri;

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getNewsSearchUri() {
        return newsSearchUri;
    }

    public void setNewsSearchUri(String newsSearchUri) {
        this.newsSearchUri = newsSearchUri;
    }
}
