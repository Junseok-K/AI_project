package com.example.ainews.summary;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SummaryMessageSplitter {

    public List<String> split(String message, int maxChars) {
        if (message == null || message.isBlank()) {
            return List.of("");
        }
        if (message.length() <= maxChars) {
            return List.of(message);
        }
        List<String> chunks = new ArrayList<>();
        String[] blocks = message.split("\\n\\n");
        StringBuilder current = new StringBuilder();
        for (String block : blocks) {
            String candidate = current.isEmpty() ? block : current + "\n\n" + block;
            if (candidate.length() <= maxChars) {
                current = new StringBuilder(candidate);
                continue;
            }
            if (!current.isEmpty()) {
                chunks.add(current.toString());
            }
            current = new StringBuilder(block.length() <= maxChars ? block : block.substring(0, maxChars));
        }
        if (!current.isEmpty()) {
            chunks.add(current.toString());
        }
        return chunks;
    }
}
