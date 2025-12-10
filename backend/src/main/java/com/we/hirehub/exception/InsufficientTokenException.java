package com.we.hirehub.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.PAYMENT_REQUIRED)
public class InsufficientTokenException extends RuntimeException {
    public InsufficientTokenException(String msg) { super(msg); }
}
