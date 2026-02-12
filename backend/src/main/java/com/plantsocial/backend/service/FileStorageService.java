package com.plantsocial.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Stores a file and returns the publicly accessible URL/path.
     */
    String storeFile(MultipartFile file);
}
