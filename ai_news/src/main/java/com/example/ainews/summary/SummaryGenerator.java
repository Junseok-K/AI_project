package com.example.ainews.summary;

import com.example.ainews.domain.SummarySlot;
import java.util.List;

public interface SummaryGenerator {
    String generate(SummarySlot slot, List<SummaryArticle> articles);
}
