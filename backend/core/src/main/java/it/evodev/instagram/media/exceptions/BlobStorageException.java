package it.evodev.instagram.media.exceptions;

public class BlobStorageException extends RuntimeException {
    public BlobStorageException(String message) {
        super(message);
    }

    public BlobStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
