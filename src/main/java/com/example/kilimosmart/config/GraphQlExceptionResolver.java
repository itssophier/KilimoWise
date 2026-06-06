package com.example.kilimosmart.config;

import com.example.kilimosmart.config.errors.ApiException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolationException;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {

        if (ex instanceof ApiException api) {
            return GraphqlErrorBuilder.newError(env)
                    .errorType(ErrorType.BAD_REQUEST)
                    .message(api.getMessage())
                    .extensions(Map.of(
                            "code", api.getCode(),
                            "retryable", api.isRetryable()
                    ))
                    .build();
        }

        if (ex instanceof ConstraintViolationException cve) {
            String detail = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("validation failed");
            return GraphqlErrorBuilder.newError(env)
                    .errorType(ErrorType.BAD_REQUEST)
                    .message("Invalid input: " + detail)
                    .extensions(Map.of(
                            "code", "VALIDATION_ERROR",
                            "retryable", false
                    ))
                    .build();
        }

        if (ex instanceof IllegalArgumentException) {
            return GraphqlErrorBuilder.newError(env)
                    .errorType(ErrorType.BAD_REQUEST)
                    .message(ex.getMessage())
                    .extensions(Map.of(
                            "code", "BAD_REQUEST",
                            "retryable", false
                    ))
                    .build();
        }

        if (ex instanceof SecurityException) {
            return GraphqlErrorBuilder.newError(env)
                    .errorType(ErrorType.FORBIDDEN)
                    .message(ex.getMessage())
                    .extensions(Map.of(
                            "code", "FORBIDDEN",
                            "retryable", false
                    ))
                    .build();
        }

        return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Internal server error")
                .extensions(Map.of(
                        "code", "INTERNAL_ERROR",
                        "retryable", true
                ))
                .build();
    }

    @Override
    protected List<GraphQLError> resolveToMultipleErrors(Throwable ex, DataFetchingEnvironment env) {
        return List.of(resolveToSingleError(ex, env));
    }

    static Map<String, Object> extensionsFor(Throwable ex) {
        if (ex instanceof ApiException api) {
            return Map.of("code", api.getCode(), "retryable", api.isRetryable());
        }
        if (ex instanceof ConstraintViolationException) {
            return Map.of("code", "VALIDATION_ERROR", "retryable", false);
        }
        if (ex instanceof IllegalArgumentException) {
            return Map.of("code", "BAD_REQUEST", "retryable", false);
        }
        if (ex instanceof SecurityException) {
            return Map.of("code", "FORBIDDEN", "retryable", false);
        }
        return Map.of("code", "INTERNAL_ERROR", "retryable", true);
    }
}
