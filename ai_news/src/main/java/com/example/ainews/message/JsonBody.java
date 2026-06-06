package com.example.ainews.message;

import com.fasterxml.jackson.databind.ObjectMapper;

final class JsonBody {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private JsonBody() {
    }

    static String toJson(Object value) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize Kakao template object", ex);
        }
    }
}
