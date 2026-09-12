package com.civicissue.service;

import com.civicissue.dto.issue.IssueAssignRequest;
import com.civicissue.dto.issue.IssueCreateRequest;
import com.civicissue.dto.issue.IssueListResponse;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.dto.issue.IssueSearchRequest;
import com.civicissue.dto.issue.IssueUpdatePriorityRequest;
import com.civicissue.dto.issue.IssueUpdateStatusRequest;
import com.civicissue.dto.user.PageResponse;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IssueService {

    IssueResponse createIssue(IssueCreateRequest request, MultipartFile image, Authentication authentication);

    IssueResponse createIssue(IssueCreateRequest request, MultipartFile image, String userEmail);

    List<IssueListResponse> getUserIssues(IssueStatus status, Authentication authentication);

    List<IssueResponse> getMyIssues(String email, IssueStatus statusFilter);

    IssueResponse getIssueById(Long id, Authentication authentication);

    IssueResponse getIssueById(Long id);

    PageResponse<IssueListResponse> searchIssues(IssueSearchRequest request);

    IssueResponse updateStatus(Long id, IssueUpdateStatusRequest request);

    IssueResponse updatePriority(Long id, IssueUpdatePriorityRequest request);

    IssueResponse assignToDepartment(Long id, IssueAssignRequest request);

    List<IssueListResponse> findNearbyIssues(double lat, double lon, double radius);

    List<IssueResponse> getNearbyIssues(Double lat, Double lon, Double radiusMeters);

    IssueResponse updateIssueStatus(Long id, IssueStatus status, String adminEmail);

    IssueResponse updateIssuePriority(Long id, Priority priority, String adminEmail);

    IssueResponse assignIssue(Long id, Long departmentId, String notes, String adminEmail);
}
