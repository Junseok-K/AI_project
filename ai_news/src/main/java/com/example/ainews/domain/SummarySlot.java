package com.example.ainews.domain;

public enum SummarySlot {
    MORNING("모닝 브리핑"),
    LUNCH("점심 브리핑"),
    EVENING("데일리 마감");

    private final String title;

    SummarySlot(String title) {
        this.title = title;
    }

    public String title() {
        return title;
    }
}
