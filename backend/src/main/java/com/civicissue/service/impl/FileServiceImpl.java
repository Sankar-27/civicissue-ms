package com.civicissue.service.impl;

import com.civicissue.config.StorageConfig;
import com.civicissue.exception.BadRequestException;
import com.civicissue.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

    private final StorageConfig storageConfig;

    @Override
    public String saveFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("File name is required");
        }

        String extension = extractExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(
                    "File type not allowed. Allowed types: " + ALLOWED_EXTENSIONS);
        }

        String filename = UUID.randomUUID() + "." + extension;
        Path targetPath = storageConfig.getUploadPath().resolve(filename);

        try {
            Files.copy(file.getInputStream(), targetPath);
        } catch (IOException e) {
            log.error("Failed to save file: {}", filename, e);
            throw new BadRequestException("Failed to save file: " + e.getMessage());
        }

        return "/uploads/" + filename;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String filename = fileUrl.replace("/uploads/", "");
        Path filePath = storageConfig.getUploadPath().resolve(filename);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", filename, e);
        }
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            throw new BadRequestException("File must have an extension");
        }
        return filename.substring(dotIndex + 1);
    }
}
