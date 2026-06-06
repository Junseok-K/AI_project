package com.example.ainews.news;

import org.jsoup.Jsoup;

final class HtmlText {
    private HtmlText() {
    }

    static String clean(String value) {
        if (value == null) {
            return "";
        }
        return Jsoup.parse(value).text().replace("&quot;", "\"").trim();
    }
}
