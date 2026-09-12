package com.civicissue.service;

import com.civicissue.dto.issue.IssueCreateRequest;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.entity.postgres.Assignment;
import com.civicissue.entity.postgres.Department;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.User;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.NotificationType;
import com.civicissue.enums.Priority;
import com.civicissue.enums.Role;
import com.civicissue.exception.BadRequestException;
import com.civicissue.repository.AssignmentRepository;
import com.civicissue.repository.CommentRepository;
import com.civicissue.repository.DepartmentRepository;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.UserRepository;
import com.civicissue.service.impl.IssueServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IssueServiceTest {

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AssignmentRepository assignmentRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private DuplicateDetectionService duplicateDetectionService;

    @Mock
    private FileService fileService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private IssueTimelineService issueTimelineService;

    @InjectMocks
    private IssueServiceImpl issueService;

    private User citizen;
    private IssueCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        citizen = User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .role(Role.CITIZEN)
                .enabled(true)
                .build();

        createRequest = IssueCreateRequest.builder()
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .latitude(12.9716)
                .longitude(77.5946)
                .build();

        lenient().when(issueTimelineService.getTimeline(anyLong())).thenReturn(List.of());
    }

    @Test
    void createIssue_withLocationNoDuplicate_setsOpenStatus() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(citizen));
        when(duplicateDetectionService.findDuplicate(Category.STREETLIGHT, 12.9716, 77.5946))
                .thenReturn(Optional.empty());

        Issue saved = Issue.builder()
                .id(10L)
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .latitude(12.9716)
                .longitude(77.5946)
                .status(IssueStatus.OPEN)
                .priority(Priority.MEDIUM)
                .reportedBy(citizen)
                .build();
        when(issueRepository.save(any(Issue.class))).thenReturn(saved);

        IssueResponse response = issueService.createIssue(createRequest, null, "john@example.com");

        assertThat(response.getStatus()).isEqualTo(IssueStatus.OPEN);
        assertThat(response.getDuplicateOfId()).isNull();

        ArgumentCaptor<Issue> issueCaptor = ArgumentCaptor.forClass(Issue.class);
        verify(issueRepository).save(issueCaptor.capture());
        assertThat(issueCaptor.getValue().getStatus()).isEqualTo(IssueStatus.OPEN);

        verify(issueTimelineService).recordEvent(
                eq(10L), eq(IssueStatus.OPEN), eq("ISSUE_CREATED"), any(), any(), any());
    }

    @Test
    void createIssue_withDuplicate_setsRejectedAndLinks() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(citizen));

        Issue existing = Issue.builder()
                .id(5L)
                .title("Existing streetlight issue")
                .description("Already reported")
                .category(Category.STREETLIGHT)
                .status(IssueStatus.OPEN)
                .build();
        when(duplicateDetectionService.findDuplicate(Category.STREETLIGHT, 12.9716, 77.5946))
                .thenReturn(Optional.of(existing));

        Issue saved = Issue.builder()
                .id(10L)
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .latitude(12.9716)
                .longitude(77.5946)
                .status(IssueStatus.REJECTED)
                .priority(Priority.MEDIUM)
                .reportedBy(citizen)
                .duplicateOf(existing)
                .build();
        when(issueRepository.save(any(Issue.class))).thenReturn(saved);

        IssueResponse response = issueService.createIssue(createRequest, null, "john@example.com");

        assertThat(response.getStatus()).isEqualTo(IssueStatus.REJECTED);
        assertThat(response.getDuplicateOfId()).isEqualTo(5L);

        ArgumentCaptor<Issue> issueCaptor = ArgumentCaptor.forClass(Issue.class);
        verify(issueRepository).save(issueCaptor.capture());
        assertThat(issueCaptor.getValue().getStatus()).isEqualTo(IssueStatus.REJECTED);
        assertThat(issueCaptor.getValue().getDuplicateOf()).isEqualTo(existing);

        verify(issueTimelineService).recordEvent(
                eq(10L), eq(IssueStatus.REJECTED), eq("ISSUE_REJECTED_DUPLICATE"), any(), any(), any());
    }

    @Test
    void updateIssueStatus_validTransition_recordsTimelineAndNotifies() {
        Issue issue = Issue.builder()
                .id(10L)
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .status(IssueStatus.ASSIGNED)
                .priority(Priority.MEDIUM)
                .reportedBy(citizen)
                .build();

        when(issueRepository.findById(10L)).thenReturn(Optional.of(issue));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.updateIssueStatus(10L, IssueStatus.IN_PROGRESS, "admin@example.com");

        assertThat(response.getStatus()).isEqualTo(IssueStatus.IN_PROGRESS);
        verify(issueRepository).save(issue);
        verify(issueTimelineService).recordEvent(
                eq(10L), eq(IssueStatus.IN_PROGRESS), eq("ISSUE_STATUS_CHANGED"), any(), any(), any());
        verify(notificationService).createNotification(
                eq(1L), any(), any(), eq(NotificationType.STATUS_UPDATE), eq(10L));
    }

    @Test
    void updateIssueStatus_invalidTransition_throwsBadRequest() {
        Issue issue = Issue.builder()
                .id(10L)
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .status(IssueStatus.OPEN)
                .build();

        when(issueRepository.findById(10L)).thenReturn(Optional.of(issue));

        assertThatThrownBy(() ->
                issueService.updateIssueStatus(10L, IssueStatus.CLOSED, "admin@example.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid status transition");

        verify(issueRepository, never()).save(any(Issue.class));
        verify(issueTimelineService, never()).recordEvent(any(), any(), any(), any(), any(), any());
        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    void assignIssue_createsAssignmentAndSetsDepartment() {
        Issue issue = Issue.builder()
                .id(10L)
                .title("Broken streetlight")
                .description("The streetlight at main road is broken")
                .category(Category.STREETLIGHT)
                .status(IssueStatus.OPEN)
                .priority(Priority.MEDIUM)
                .reportedBy(citizen)
                .build();

        User admin = User.builder()
                .id(2L)
                .name("Admin")
                .email("admin@example.com")
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        Department department = Department.builder()
                .id(7L)
                .name("Electricity Department")
                .active(true)
                .build();

        when(issueRepository.findById(10L)).thenReturn(Optional.of(issue));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(departmentRepository.findById(7L)).thenReturn(Optional.of(department));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.assignIssue(10L, 7L, "Please investigate", "admin@example.com");

        ArgumentCaptor<Assignment> assignmentCaptor = ArgumentCaptor.forClass(Assignment.class);
        verify(assignmentRepository).save(assignmentCaptor.capture());
        assertThat(assignmentCaptor.getValue().getIssue()).isEqualTo(issue);
        assertThat(assignmentCaptor.getValue().getDepartment()).isEqualTo(department);
        assertThat(assignmentCaptor.getValue().getAssignedBy()).isEqualTo(admin);
        assertThat(assignmentCaptor.getValue().getNotes()).isEqualTo("Please investigate");

        assertThat(issue.getDepartment()).isEqualTo(department);
        assertThat(issue.getStatus()).isEqualTo(IssueStatus.ASSIGNED);
        verify(issueRepository).save(issue);
        verify(issueTimelineService).recordEvent(
                eq(10L), eq(IssueStatus.ASSIGNED), eq("ISSUE_ASSIGNED"), any(), any(), any());
        verify(notificationService).createNotification(
                eq(1L), any(), any(), eq(NotificationType.ASSIGNMENT), any());

        assertThat(response.getDepartmentId()).isEqualTo(7L);
        assertThat(response.getDepartmentName()).isEqualTo("Electricity Department");
        assertThat(response.getStatus()).isEqualTo(IssueStatus.ASSIGNED);
    }
}