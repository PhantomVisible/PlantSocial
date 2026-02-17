package com.plantsocial.backend.exception;

/**
 * Generic business logic exception with an error code.
 */
public class BusinessException extends RuntimeException {

    public static final String USER_NOT_FOUND = "USER_NOT_FOUND";

    private final String code;

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
