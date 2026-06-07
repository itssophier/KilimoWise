package com.example.kilimosmart.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.error("HttpMessageNotReadableException: {}", ex.getMessage(), ex);
        Throwable cause = ex.getMostSpecificCause();
        log.error("Cause class: {}, message: {}", cause != null ? cause.getClass().getName() : "null", cause != null ? cause.getMessage() : "null");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "status", 400,
                        "error", "Bad Request",
                        "message", ex.getMessage(),
                        "cause", cause != null ? cause.getMessage() : "null"
                ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        log.error("ResponseStatusException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of(
                        "status", ex.getStatusCode().value(),
                        "error", ex.getReason(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {} - {}", ex.getClass().getName(), ex.getMessage(), ex);
        Throwable cause = ex.getCause();
        while (cause != null) {
            log.error("Caused by: {} - {}", cause.getClass().getName(), cause.getMessage());
            cause = cause.getCause();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "status", 500,
                        "error", "Internal Server Error",
                        "exception", ex.getClass().getName(),
                        "message", ex.getMessage() != null ? ex.getMessage() : "no message"
                ));
    }
}
