package com.sabia.api.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " com id " + id + " não encontrado.");
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
