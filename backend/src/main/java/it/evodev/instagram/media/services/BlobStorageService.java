package it.evodev.instagram.media.services;

import it.evodev.instagram.media.dto.BlobUploadResult;

import java.io.InputStream;

public interface BlobStorageService {
    BlobUploadResult upload(InputStream inputStream, long contentLength, String contentType, String blobName);
    void delete(String blobName);
    /** Returns null if blob does not exist; caller is responsible for closing the stream. */
    InputStream download(String blobName);
    boolean exists(String blobName);
    /** Returns the blob size in bytes, or -1 if blob does not exist. */
    long getSize(String blobName);
}
