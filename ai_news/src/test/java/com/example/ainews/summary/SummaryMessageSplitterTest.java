package com.example.ainews.summary;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SummaryMessageSplitterTest {
    private final SummaryMessageSplitter splitter = new SummaryMessageSplitter();

    @Test
    void splitsLongMessageByBlocks() {
        String message = "first block\n\nsecond block is longer\n\nthird block";

        assertThat(splitter.split(message, 24))
                .containsExactly("first block", "second block is longer", "third block");
    }
}
