package com.we.hirehub.exception;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", Instant.now(), "error", "NOT_FOUND", "message", e.getMessage()
        ));
    }

    @ExceptionHandler(ForbiddenEditException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenEditException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", Instant.now(), "error", "CONFLICT", "message", e.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now(), "error", "BAD_REQUEST", "message", e.getBindingResult().toString()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArg(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "timestamp", Instant.now(),
                "error", "BAD_REQUEST",
                "message", e.getMessage()
        ));
    }
}
