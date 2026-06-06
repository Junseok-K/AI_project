package com.example.ainews.news;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class ArticleDeduplicator {

    public String urlHash(String originalLink, String link) {
        return sha256(canonicalUrl(originalLink == null || originalLink.isBlank() ? link : originalLink));
    }

    public String titleHash(String title) {
        return sha256(normalizeTitle(title));
    }

    public double similarity(String left, String right) {
        Set<String> leftTokens = tokenize(normalizeTitle(left));
        Set<String> rightTokens = tokenize(normalizeTitle(right));
        if (leftTokens.isEmpty() || rightTokens.isEmpty()) {
            return 0.0;
        }
        long intersection = leftTokens.stream().filter(rightTokens::contains).count();
        long union = leftTokens.size() + rightTokens.size() - intersection;
        return (double) intersection / union;
    }

    String normalizeTitle(String title) {
        if (title == null) {
            return "";
        }
        return title.toLowerCase(Locale.KOREAN)
                .replaceAll("\\[[^]]*]", " ")
                .replaceAll("\\([^)]*\\)", " ")
                .replaceAll("[^0-9a-z가-힣 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private Set<String> tokenize(String value) {
        return Arrays.stream(value.split("\\s+"))
                .filter(token -> token.length() >= 2)
                .collect(Collectors.toSet());
    }

    private String canonicalUrl(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        try {
            URI uri = URI.create(value.trim());
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            String path = uri.getPath() == null ? "" : uri.getPath();
            return uri.getScheme() + "://" + host + path;
        } catch (Exception ex) {
            return value.trim();
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot create SHA-256 hash", ex);
        }
    }
}
