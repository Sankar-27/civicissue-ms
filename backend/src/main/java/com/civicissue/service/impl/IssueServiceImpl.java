package com.civicissue.service.impl;

import com.civicissue.dto.issue.IssueAssignRequest;
import com.civicissue.dto.issue.IssueCreateRequest;
import com.civicissue.dto.issue.IssueListResponse;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.dto.issue.IssueSearchRequest;
import com.civicissue.dto.issue.IssueUpdatePriorityRequest;
import com.civicissue.dto.issue.IssueUpdateStatusRequest;
import com.civicissue.dto.issue.TimelineEventResponse;
import com.civicissue.dto.user.PageResponse;
import com.civicissue.dto.user.UserResponse;
import com.civicissue.entity.postgres.Assignment;
import com.civicissue.entity.postgres.Comment;
import com.civicissue.entity.postgres.Department;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.User;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.NotificationType;
import com.civicissue.enums.Priority;
import com.civicissue.exception.BadRequestException;
import com.civicissue.exception.ResourceNotFoundException;
import com.civicissue.repository.AssignmentRepository;
import com.civicissue.repository.CommentRepository;
import com.civicissue.repository.DepartmentRepository;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.UserRepository;
import com.civicissue.security.CustomUserDetails;
import com.civicissue.service.DuplicateDetectionService;
import com.civicissue.service.FileService;
import com.civicissue.service.IssueService;
import com.civicissue.service.IssueTimelineService;
import com.civicissue.service.NotificationService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final CommentRepository commentRepository;
    private final DuplicateDetectionService duplicateDetectionService;
    private final FileService fileService;
    private final NotificationService notificationService;
    private final IssueTimelineService issueTimelineService;

    @Override
    @Transactional
    public IssueResponse createIssue(IssueCreateRequest request, MultipartFile image, Authentication authentication) {
        User user = extractUser(authentication);
        return doCreateIssue(request, image, user);
    }

    @Override
    @Transactional
    public IssueResponse createIssue(IssueCreateRequest request, MultipartFile image, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));
        return doCreateIssue(request, image, user);
    }

    private IssueResponse doCreateIssue(IssueCreateRequest request, MultipartFile image, User user) {
        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileService.saveFile(image);
        }

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .reportedBy(user)
                .imageUrl(imageUrl)
                .build();

        if (request.getLatitude() != null && request.getLongitude() != null) {
            Optional<Issue> duplicate = duplicateDetectionService.findDuplicate(
                    request.getCategory(), request.getLatitude(), request.getLongitude());
            if (duplicate.isPresent()) {
                issue.setStatus(IssueStatus.REJECTED);
                issue.setDuplicateOf(duplicate.get());
            } else {
                issue.setStatus(IssueStatus.OPEN);
            }
        } else {
            issue.setStatus(IssueStatus.OPEN);
        }

        Issue saved = issueRepository.save(issue);

        String action = issue.getStatus() == IssueStatus.REJECTED
                ? "ISSUE_REJECTED_DUPLICATE"
                : "ISSUE_CREATED";
        String message = issue.getStatus() == IssueStatus.REJECTED && issue.getDuplicateOf() != null
                ? "Issue flagged as a potential duplicate of issue #" + issue.getDuplicateOf().getId()
                : "Issue reported";
        issueTimelineService.recordEvent(saved.getId(), saved.getStatus(), action, message,
                user.getId(), user.getName());

        return toResponse(saved);
    }

    @Override
    public List<IssueListResponse> getUserIssues(IssueStatus status, Authentication authentication) {
        User user = extractUser(authentication);
        List<Issue> issues;
        if (status != null) {
            issues = issueRepository.findByReportedByIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .filter(i -> i.getStatus() == status)
                    .toList();
        } else {
            issues = issueRepository.findByReportedByIdOrderByCreatedAtDesc(user.getId());
        }
        return issues.stream().map(this::toListResponse).toList();
    }

    @Override
    public List<IssueResponse> getMyIssues(String email, IssueStatus statusFilter) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        List<Issue> issues;
        if (statusFilter != null) {
            issues = issueRepository.findByReportedByIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .filter(i -> i.getStatus() == statusFilter)
                    .toList();
        } else {
            issues = issueRepository.findByReportedByIdOrderByCreatedAtDesc(user.getId());
        }

        return issues.stream().map(this::toResponse).toList();
    }

    @Override
    public IssueResponse getIssueById(Long id, Authentication authentication) {
        return getIssueById(id);
    }

    @Override
    public IssueResponse getIssueById(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));
        return toResponse(issue);
    }

    @Override
    public PageResponse<IssueListResponse> searchIssues(IssueSearchRequest request) {
        Page<Issue> page = searchIssuesInner(request);
        Page<IssueListResponse> listPage = page.map(this::toListResponse);
        return toPageResponse(listPage);
    }

    private Page<Issue> searchIssuesInner(IssueSearchRequest request) {
        Sort sort = Sort.by(Sort.Direction.fromString(request.getSortDir()), request.getSortBy());
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        Specification<Issue> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (request.getSearch() != null && !request.getSearch().isBlank()) {
                String pattern = "%" + request.getSearch().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            if (request.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), request.getStatus()));
            }

            if (request.getPriority() != null) {
                predicates.add(cb.equal(root.get("priority"), request.getPriority()));
            }

            if (request.getCategory() != null) {
                predicates.add(cb.equal(root.get("category"), request.getCategory()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return issueRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional
    public IssueResponse updateStatus(Long id, IssueUpdateStatusRequest request) {
        return updateIssueStatus(id, request.getStatus(), getAdminFromContext());
    }

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, IssueStatus newStatus, String adminEmail) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));

        IssueStatus oldStatus = issue.getStatus();
        validateStatusTransition(oldStatus, newStatus);

        issue.setStatus(newStatus);
        Issue saved = issueRepository.save(issue);

        issueTimelineService.recordEvent(saved.getId(), newStatus, "ISSUE_STATUS_CHANGED",
                "Status changed from " + oldStatus + " to " + newStatus,
                null, adminEmail);

        if (saved.getReportedBy() != null) {
            notificationService.createNotification(
                    saved.getReportedBy().getId(),
                    "Issue Status Updated",
                    "Your issue \"" + saved.getTitle() + "\" status changed to " + newStatus.name(),
                    NotificationType.STATUS_UPDATE,
                    saved.getId()
            );
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse updatePriority(Long id, IssueUpdatePriorityRequest request) {
        return updateIssuePriority(id, request.getPriority(), getAdminFromContext());
    }

    @Override
    @Transactional
    public IssueResponse updateIssuePriority(Long id, Priority priority, String adminEmail) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));

        Priority oldPriority = issue.getPriority();
        issue.setPriority(priority);
        Issue saved = issueRepository.save(issue);

        issueTimelineService.recordEvent(saved.getId(), saved.getStatus(), "ISSUE_PRIORITY_CHANGED",
                "Priority changed from " + oldPriority + " to " + priority,
                null, adminEmail);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse assignToDepartment(Long id, IssueAssignRequest request) {
        return assignIssue(id, request.getDepartmentId(), request.getNotes(), getAdminFromContext());
    }

    @Override
    @Transactional
    public IssueResponse assignIssue(Long id, Long departmentId, String notes, String adminEmail) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with email: " + adminEmail));

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + departmentId));

        Assignment assignment = Assignment.builder()
                .issue(issue)
                .department(department)
                .assignedBy(admin)
                .notes(notes)
                .build();
        assignmentRepository.save(assignment);

        issue.setDepartment(department);
        issue.setStatus(IssueStatus.ASSIGNED);
        issueRepository.save(issue);

        issueTimelineService.recordEvent(issue.getId(), issue.getStatus(), "ISSUE_ASSIGNED",
                "Assigned to " + department.getName(),
                admin.getId(), admin.getName());

        if (issue.getReportedBy() != null) {
            notificationService.createNotification(
                    issue.getReportedBy().getId(),
                    "Issue Assigned",
                    "Your issue \"" + issue.getTitle() + "\" was assigned to " + department.getName(),
                    NotificationType.ASSIGNMENT,
                    issue.getId()
            );
        }

        return toResponse(issue);
    }

    @Override
    public List<IssueListResponse> findNearbyIssues(double lat, double lon, double radius) {
        return issueRepository.findNearbyIssuesAll(lat, lon, radius).stream()
                .map(this::toListResponse)
                .toList();
    }

    @Override
    public List<IssueResponse> getNearbyIssues(Double lat, Double lon, Double radiusMeters) {
        List<Issue> issues = issueRepository.findNearbyIssuesAll(lat, lon, radiusMeters);
        return issues.stream().map(this::toResponse).toList();
    }

    private void validateStatusTransition(IssueStatus current, IssueStatus next) {
        Map<IssueStatus, Set<IssueStatus>> validTransitions = Map.of(
                IssueStatus.OPEN, Set.of(IssueStatus.UNDER_REVIEW, IssueStatus.ASSIGNED, IssueStatus.REJECTED),
                IssueStatus.UNDER_REVIEW, Set.of(IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.REJECTED),
                IssueStatus.ASSIGNED, Set.of(IssueStatus.IN_PROGRESS),
                IssueStatus.IN_PROGRESS, Set.of(IssueStatus.RESOLVED),
                IssueStatus.RESOLVED, Set.of(IssueStatus.CLOSED),
                IssueStatus.CLOSED, Set.of(),
                IssueStatus.REJECTED, Set.of(IssueStatus.OPEN)
        );

        Set<IssueStatus> allowed = validTransitions.getOrDefault(current, Set.of());
        if (!allowed.contains(next)) {
            throw new BadRequestException(
                    "Invalid status transition from " + current + " to " + next);
        }
    }

    private String getAdminFromContext() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    private User extractUser(Authentication authentication) {
        if (authentication.getPrincipal() instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getUser();
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + email));
    }

    private PageResponse<IssueListResponse> toPageResponse(Page<IssueListResponse> page) {
        return PageResponse.<IssueListResponse>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private IssueListResponse toListResponse(Issue issue) {
        int commentCount = commentRepository.findByIssueIdOrderByCreatedAtAsc(issue.getId()).size();

        return IssueListResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .category(issue.getCategory())
                .imageUrl(issue.getImageUrl())
                .status(issue.getStatus())
                .priority(issue.getPriority())
                .reportedBy(toUserResponse(issue.getReportedBy()))
                .duplicateOfId(issue.getDuplicateOf() != null ? issue.getDuplicateOf().getId() : null)
                .departmentId(issue.getDepartment() != null ? issue.getDepartment().getId() : null)
                .departmentName(issue.getDepartment() != null ? issue.getDepartment().getName() : null)
                .reporterPhone(issue.getReporterPhone())
                .commentCount(commentCount)
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }

    private IssueResponse toResponse(Issue issue) {
        List<TimelineEventResponse> timeline = issueTimelineService.getTimeline(issue.getId());

        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .category(issue.getCategory())
                .imageUrl(issue.getImageUrl())
                .status(issue.getStatus())
                .priority(issue.getPriority())
                .reportedBy(toUserResponse(issue.getReportedBy()))
                .duplicateOfId(issue.getDuplicateOf() != null ? issue.getDuplicateOf().getId() : null)
                .departmentId(issue.getDepartment() != null ? issue.getDepartment().getId() : null)
                .departmentName(issue.getDepartment() != null ? issue.getDepartment().getName() : null)
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .timeline(timeline)
                .build();
    }

    private UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
