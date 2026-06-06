package com.example.kilimosmart.config;

import com.example.kilimosmart.config.errors.ApiException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GraphQlExceptionResolverTest {

    @Test
    void apiExceptionExtensionsCarryCodeAndRetryable() {
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                ApiException.notFound("Farmer"));
        assertEquals("NOT_FOUND", ext.get("code"));
        assertEquals(false, ext.get("retryable"));
    }

    @Test
    void retryableApiExceptionFlag() {
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                ApiException.upstream("gemini timeout"));
        assertEquals("UPSTREAM_ERROR", ext.get("code"));
        assertEquals(true, ext.get("retryable"));
    }

    @Test
    void validationExceptionIsBadRequest() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        Set<ConstraintViolation<Object>> violations = validator.validate(new Object());
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                new ConstraintViolationException(violations));
        assertEquals("VALIDATION_ERROR", ext.get("code"));
        assertFalse((Boolean) ext.get("retryable"));
    }

    @Test
    void illegalArgumentIsBadRequest() {
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                new IllegalArgumentException("bad"));
        assertEquals("BAD_REQUEST", ext.get("code"));
    }

    @Test
    void securityExceptionIsForbidden() {
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                new SecurityException("denied"));
        assertEquals("FORBIDDEN", ext.get("code"));
    }

    @Test
    void unknownExceptionIsInternalAndRetryable() {
        Map<String, Object> ext = GraphQlExceptionResolver.extensionsFor(
                new RuntimeException("secret"));
        assertEquals("INTERNAL_ERROR", ext.get("code"));
        assertTrue((Boolean) ext.get("retryable"));
    }
}
