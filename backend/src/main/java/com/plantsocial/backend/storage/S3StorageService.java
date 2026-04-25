package com.plantsocial.backend.storage;

import com.plantsocial.backend.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Primary
@Service
public class S3StorageService implements FileStorageService {

    private final S3Client s3;
    private final String bucketName;
    private final String endpoint;

    public S3StorageService(
            S3Client s3,
            @Value("${xyla.storage.bucket-name}") String bucketName,
            @Value("${xyla.storage.endpoint}") String endpoint) {
        this.s3 = s3;
        this.bucketName = bucketName;
        this.endpoint = endpoint;
    }

    @PostConstruct
    public void ensureBucketExists() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket '{}' already exists", bucketName);
        } catch (NoSuchBucketException e) {
            log.info("S3 bucket '{}' not found — creating...", bucketName);
            s3.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            applyPublicReadPolicy();
            log.info("S3 bucket '{}' created with public-read policy", bucketName);
        } catch (Exception e) {
            log.warn("Could not verify S3 bucket (MinIO may not be running): {}", e.getMessage());
        }
    }

    private void applyPublicReadPolicy() {
        String policy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [{
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::%s/*"]
                  }]
                }
                """.formatted(bucketName);

        s3.putBucketPolicy(PutBucketPolicyRequest.builder()
                .bucket(bucketName)
                .policy(policy)
                .build());
    }

    /**
     * Uploads a file to MinIO under the given folder prefix and returns its public URL.
     */
    public String uploadFile(MultipartFile file, String folder) {
        validateImageFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + extension;

        try {
            s3.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3: " + e.getMessage(), e);
        }

        return endpoint + "/" + bucketName + "/" + key;
    }

    /**
     * Convenience overload — stores under the default "media" folder.
     * Satisfies the {@link FileStorageService} interface used by existing callers.
     */
    @Override
    public String storeFile(MultipartFile file) {
        return uploadFile(file, "media");
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".bin";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
