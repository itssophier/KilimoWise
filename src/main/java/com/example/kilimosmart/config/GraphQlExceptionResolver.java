package com.example.kilimosmart.config;

import com.example.kilimosmart.config.errors.ApiException;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    private static final Logger log = LoggerFactory.getLogger(GraphQlExceptionResolver.class);

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

        log.error("Unhandled GraphQL error in field '{}': {} - {}",
                env.getField().getName(),
                ex.getClass().getName(),
                ex.getMessage(),
                ex);

        Map<String, Object> ext = new HashMap<>();
        ext.put("code", "INTERNAL_ERROR");
        ext.put("retryable", true);
        ext.put("exceptionType", ex.getClass().getName());
        String msg = ex.getMessage();
        if (msg != null && msg.length() > 200) msg = msg.substring(0, 200);
        if (msg != null) ext.put("cause", msg);
        Throwable cause = ex.getCause();
        if (cause != null) {
            ext.put("causeType", cause.getClass().getName());
            String cmsg = cause.getMessage();
            if (cmsg != null && cmsg.length() > 200) cmsg = cmsg.substring(0, 200);
            if (cmsg != null) ext.put("causeMessage", cmsg);
        }

        return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Internal server error")
                .extensions(ext)
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
