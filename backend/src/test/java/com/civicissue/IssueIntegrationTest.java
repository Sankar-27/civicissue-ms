package com.civicissue;

import com.civicissue.dto.auth.AuthResponse;
import com.civicissue.dto.auth.LoginRequest;
import com.civicissue.dto.auth.RegisterRequest;
import com.civicissue.dto.issue.IssueCreateRequest;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.IssueTimeline;
import com.civicissue.entity.postgres.Notification;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.IssueTimelineRepository;
import com.civicissue.repository.NotificationRepository;
import com.civicissue.service.AuthService;
import com.civicissue.service.IssueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IssueIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private IssueService issueService;

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private IssueTimelineRepository issueTimelineRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private String userEmail;

    @BeforeEach
    void registerUser() {
        userEmail = "citizen-" + System.nanoTime() + "@example.com";
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name("Integration User")
                .email(userEmail)
                .password("password123")
                .build();
        authService.register(registerRequest);
    }

    @Test
    void createIssue_endToEnd_savesWithOpenStatus() {
        IssueCreateRequest createRequest = IssueCreateRequest.builder()
                .title("Pothole on main road")
                .description("Large pothole needs immediate attention")
                .category(Category.ROAD)
                .build();

        IssueResponse response = issueService.createIssue(createRequest, null, userEmail);

        assertThat(response.getId()).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Pothole on main road");
        assertThat(response.getCategory()).isEqualTo(Category.ROAD);
        assertThat(response.getStatus()).isEqualTo(IssueStatus.OPEN);
        assertThat(response.getReportedBy()).isNotNull();
        assertThat(response.getReportedBy().getEmail()).isEqualTo(userEmail);

        Optional<Issue> saved = issueRepository.findById(response.getId());
        assertThat(saved).isPresent();
        assertThat(saved.get().getStatus()).isEqualTo(IssueStatus.OPEN);
        assertThat(saved.get().getReportedBy().getEmail()).isEqualTo(userEmail);

        List<IssueTimeline> events =
                issueTimelineRepository.findByIssueIdOrderByCreatedAtAsc(response.getId());
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getAction()).isEqualTo("ISSUE_CREATED");
        assertThat(events.get(0).getStatus()).isEqualTo(IssueStatus.OPEN);
    }

    @Test
    void issueLifecycle_updateToInProgress_recordsTimelineAndNotifications() {
        IssueCreateRequest createRequest = IssueCreateRequest.builder()
                .title("Water leak on main road")
                .description("Continuous water leakage near junction")
                .category(Category.WATER)
                .build();

        IssueResponse created = issueService.createIssue(createRequest, null, userEmail);
        assertThat(created.getStatus()).isEqualTo(IssueStatus.OPEN);

        IssueResponse underReview = issueService.updateIssueStatus(
                created.getId(), IssueStatus.UNDER_REVIEW, "admin@example.com");
        assertThat(underReview.getStatus()).isEqualTo(IssueStatus.UNDER_REVIEW);

        IssueResponse inProgress = issueService.updateIssueStatus(
                created.getId(), IssueStatus.IN_PROGRESS, "admin@example.com");
        assertThat(inProgress.getStatus()).isEqualTo(IssueStatus.IN_PROGRESS);

        Optional<Issue> persisted = issueRepository.findById(created.getId());
        assertThat(persisted).isPresent();
        assertThat(persisted.get().getStatus()).isEqualTo(IssueStatus.IN_PROGRESS);

        List<IssueTimeline> events =
                issueTimelineRepository.findByIssueIdOrderByCreatedAtAsc(created.getId());
        assertThat(events).hasSize(3);
        assertThat(events.get(0).getAction()).isEqualTo("ISSUE_CREATED");
        assertThat(events.get(1).getAction()).isEqualTo("ISSUE_STATUS_CHANGED");
        assertThat(events.get(2).getAction()).isEqualTo("ISSUE_STATUS_CHANGED");

        Long reporterId = persisted.get().getReportedBy().getId();
        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(reporterId);
        assertThat(notifications).hasSize(2);
        assertThat(notifications.get(0).getType().name()).isEqualTo("STATUS_UPDATE");
    }

    @Test
    void login_authenticatesRegisteredUser() {
        LoginRequest loginRequest = LoginRequest.builder()
                .email(userEmail)
                .password("password123")
                .build();

        AuthResponse authResponse = authService.login(loginRequest);

        assertThat(authResponse.getToken()).isNotBlank();
        assertThat(authResponse.getEmail()).isEqualTo(userEmail);
        assertThat(authResponse.getRole()).isEqualTo("CITIZEN");
        assertThat(authResponse.getUserId()).isNotNull();
    }
}