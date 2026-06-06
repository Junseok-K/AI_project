package com.example.ainews.message;

public record MessageDeliveryResult(boolean success, boolean retryable, String errorMessage) {
    public static MessageDeliveryResult ok() {
        return new MessageDeliveryResult(true, false, null);
    }

    public static MessageDeliveryResult failed(String errorMessage, boolean retryable) {
        return new MessageDeliveryResult(false, retryable, errorMessage);
    }
}
