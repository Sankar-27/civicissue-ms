package com.civicissue.service;

import com.civicissue.entity.postgres.Issue;
import com.civicissue.enums.Category;

import java.util.Optional;

public interface DuplicateDetectionService {

    Optional<Issue> findDuplicate(Category category, Double lat, Double lon);
}
