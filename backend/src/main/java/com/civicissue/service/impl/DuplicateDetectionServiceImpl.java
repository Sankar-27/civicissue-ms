package com.civicissue.service.impl;

import com.civicissue.entity.postgres.Issue;
import com.civicissue.enums.Category;
import com.civicissue.repository.IssueRepository;
import com.civicissue.service.DuplicateDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionServiceImpl implements DuplicateDetectionService {

    private final IssueRepository issueRepository;

    @Override
    public Optional<Issue> findDuplicate(Category category, Double lat, Double lon) {
        List<Issue> nearby = issueRepository.findNearbyIssuesForDuplicate(
                category.name(), lat, lon, 100.0);
        return nearby.stream().findFirst();
    }
}
