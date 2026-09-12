package com.civicissue.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    String saveFile(MultipartFile file);

    void deleteFile(String filename);
}
