package com.example.ainews.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public class OpenAiProperties {
    private String apiKey;
    private String model;
    private String chatCompletionsUri;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getChatCompletionsUri() {
        return chatCompletionsUri;
    }

    public void setChatCompletionsUri(String chatCompletionsUri) {
        this.chatCompletionsUri = chatCompletionsUri;
    }
}
