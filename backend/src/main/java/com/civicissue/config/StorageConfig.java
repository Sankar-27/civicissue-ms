package com.civicissue.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;

@Configuration
public class StorageConfig implements InitializingBean {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Getter
    private Path uploadPath;

    @Override
    public void afterPropertiesSet() throws IOException {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
    }
}
