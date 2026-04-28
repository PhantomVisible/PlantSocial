package com.plantsocial.backend.exception;

public class MarketplaceLimitExceededException extends RuntimeException {
    public MarketplaceLimitExceededException() {
        super("Free users are limited to 1 listing per week. Upgrade to Pro for unlimited listings.");
    }
}
