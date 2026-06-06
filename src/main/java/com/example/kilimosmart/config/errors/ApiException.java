package com.example.kilimosmart.config.errors;

public class ApiException extends RuntimeException {

    private final String code;
    private final boolean retryable;

    public ApiException(String code, String message) {
        this(code, message, false);
    }

    public ApiException(String code, String message, boolean retryable) {
        super(message);
        this.code = code;
        this.retryable = retryable;
    }

    public String getCode() {
        return code;
    }

    public boolean isRetryable() {
        return retryable;
    }

    public static ApiException notFound(String what) {
        return new ApiException("NOT_FOUND", what + " not found", false);
    }

    public static ApiException badRequest(String message) {
        return new ApiException("BAD_REQUEST", message, false);
    }

    public static ApiException conflict(String message) {
        return new ApiException("CONFLICT", message, false);
    }

    public static ApiException upstream(String message) {
        return new ApiException("UPSTREAM_ERROR", message, true);
    }
}
