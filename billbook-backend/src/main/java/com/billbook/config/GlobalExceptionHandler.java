
package com.billbook.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, String>> handleNullPointer(NullPointerException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Missing required field",
            "details", ex.getMessage() != null ? ex.getMessage() : "A required field was null"
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArg(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Invalid input",
            "details", ex.getMessage() != null ? ex.getMessage() : "Invalid argument provided"
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        if (msg != null && (msg.contains("not found") || msg.contains("Not found"))) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", msg));
        }
        if (msg != null && msg.contains("Not authorized")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", msg));
        }
        return ResponseEntity.badRequest().body(Map.of("error", msg != null ? msg : "Bad request"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Invalid parameter type",
            "details", ex.getName() + " should be of type " + (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown")
        ));
    }

    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<Map<String, String>> handleNumberFormat(NumberFormatException ex) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Invalid number format",
            "details", ex.getMessage() != null ? ex.getMessage() : "A number was expected but an invalid value was provided"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", "Internal server error",
            "details", ex.getClass().getSimpleName() + ": " + (ex.getMessage() != null ? ex.getMessage() : "Unknown error")
        ));
    }
}
