package it.evodev.instagram.media.services.impl;

import com.azure.storage.blob.BlobContainerClient;
import it.evodev.instagram.media.dto.BlobUploadResult;
import it.evodev.instagram.media.exceptions.BlobStorageException;
import it.evodev.instagram.media.services.BlobStorageService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class AzureBlobStorageService implements BlobStorageService {

    private static final Logger logger = LoggerFactory.getLogger(AzureBlobStorageService.class);

    private final BlobContainerClient blobContainerClient;

    @Override
    public BlobUploadResult upload(InputStream inputStream, long contentLength, String contentType, String blobName) {
        try {
            blobContainerClient.getBlobClient(blobName).upload(inputStream, contentLength, true);
            return new BlobUploadResult(blobName, contentLength, contentType);
        } catch (Exception e) {
            logger.error("Blob upload failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("Upload failed for blob: " + blobName, e);
        }
    }

    @Override
    public void delete(String blobName) {
        try {
            blobContainerClient.getBlobClient(blobName).deleteIfExists();
        } catch (Exception e) {
            logger.warn("Blob delete failed for {}: {}", blobName, e.getMessage());
        }
    }

    @Override
    public InputStream download(String blobName) {
        try {
            return blobContainerClient.getBlobClient(blobName).openInputStream();
        } catch (com.azure.storage.blob.models.BlobStorageException e) {
            if (e.getStatusCode() == 404) {
                return null;
            }
            logger.error("Blob download failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("Download failed for blob: " + blobName, e);
        } catch (Exception e) {
            logger.error("Blob download failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("Download failed for blob: " + blobName, e);
        }
    }

    @Override
    public boolean exists(String blobName) {
        try {
            return Boolean.TRUE.equals(blobContainerClient.getBlobClient(blobName).exists());
        } catch (Exception e) {
            logger.error("Blob exists check failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("Exists check failed for blob: " + blobName, e);
        }
    }

    @Override
    public long getSize(String blobName) {
        try {
            var props = blobContainerClient.getBlobClient(blobName).getProperties();
            return props.getBlobSize();
        } catch (com.azure.storage.blob.models.BlobStorageException e) {
            if (e.getStatusCode() == 404) return -1;
            logger.error("Blob getSize failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("GetSize failed for blob: " + blobName, e);
        } catch (Exception e) {
            logger.error("Blob getSize failed for {}: {}", blobName, e.getMessage());
            throw new BlobStorageException("GetSize failed for blob: " + blobName, e);
        }
    }
}
