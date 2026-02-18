package com.plantsocial.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

        // "Email already in use" — from AuthService
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(new ErrorResponse(409, ex.getMessage()));
        }

        // Duplicate DB constraint (fallback for email unique violations)
        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(new ErrorResponse(409, "A record with this information already exists."));
        }

        // Bad login credentials
        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
                return ResponseEntity
                                .status(HttpStatus.UNAUTHORIZED)
                                .body(new ErrorResponse(401, "Invalid email or password."));
        }

        // @Valid field errors
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
                String message = ex.getBindingResult().getFieldErrors().stream()
                                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                                .reduce((a, b) -> a + "; " + b)
                                .orElse("Validation failed.");
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ErrorResponse(400, message));
        }

        // Chat / business logic errors
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(new ErrorResponse(400, ex.getMessage()));
        }

        // File upload size exceeded
        @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
        public ResponseEntity<ErrorResponse> handleMaxSizeException(
                        org.springframework.web.multipart.MaxUploadSizeExceededException exc) {
                return ResponseEntity
                                .status(HttpStatus.EXPECTATION_FAILED)
                                .body(new ErrorResponse(417, "File too large. Maximum size is 10MB."));
        }

        // Fallback for everything else
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
                ex.printStackTrace(); // Keep this for server logs
                return ResponseEntity
                                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ErrorResponse(500, "Internal Error: " + ex.getMessage()));
        }
}
