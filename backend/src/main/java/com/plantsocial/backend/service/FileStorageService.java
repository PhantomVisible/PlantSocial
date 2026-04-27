package com.plantsocial.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface FileStorageService {
    /** Stores a file under users/{userId}/{folder}/ and returns its public URL. */
    String storeFile(MultipartFile file, UUID userId, String folder);

    /** Legacy overload — stores under media/. Prefer the user-scoped variant. */
    String storeFile(MultipartFile file);
}
