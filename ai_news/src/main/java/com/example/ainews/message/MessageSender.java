package com.example.ainews.message;

public interface MessageSender {
    MessageDeliveryResult send(MessageDeliveryRequest request);

    String channel();
}
