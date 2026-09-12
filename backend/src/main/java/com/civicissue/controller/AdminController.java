package com.civicissue.controller;

import com.civicissue.dto.ApiResponse;
import com.civicissue.dto.dashboard.DashboardStatsResponse;
import com.civicissue.dto.issue.IssueAssignRequest;
import com.civicissue.dto.issue.IssueListResponse;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.dto.issue.IssueSearchRequest;
import com.civicissue.dto.issue.IssueUpdatePriorityRequest;
import com.civicissue.dto.issue.IssueUpdateStatusRequest;
import com.civicissue.dto.user.PageResponse;
import com.civicissue.dto.user.UserResponse;
import com.civicissue.dto.user.UserUpdateRoleRequest;
import com.civicissue.enums.Category;
import com.civicissue.enums.IssueStatus;
import com.civicissue.enums.Priority;
import com.civicissue.service.DashboardService;
import com.civicissue.service.IssueService;
import com.civicissue.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final IssueService issueService;
    private final DashboardService dashboardService;
    private final UserService userService;

    public AdminController(IssueService issueService,
                           DashboardService dashboardService,
                           UserService userService) {
        this.issueService = issueService;
        this.dashboardService = dashboardService;
        this.userService = userService;
    }

    @GetMapping("/issues")
    @Operation(summary = "Search and filter issues with pagination")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issues retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ApiResponse getIssues(@RequestParam(required = false) String search,
                                 @RequestParam(required = false) String status,
                                 @RequestParam(required = false) String priority,
                                 @RequestParam(required = false) String category,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "20") int size,
                                 @RequestParam(defaultValue = "createdAt") String sortBy,
                                 @RequestParam(defaultValue = "desc") String sortDir) {
        IssueSearchRequest searchRequest = IssueSearchRequest.builder()
                .search(search)
                .status(parseStatus(status))
                .priority(parsePriority(priority))
                .category(parseCategory(category))
                .page(page)
                .size(size)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();
        PageResponse<IssueListResponse> issues = issueService.searchIssues(searchRequest);
        return ApiResponse.success("Issues retrieved successfully", issues);
    }

    @PatchMapping("/issues/{id}/status")
    @Operation(summary = "Update issue status")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issue status updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse updateIssueStatus(@PathVariable Long id,
                                         @Valid @RequestBody IssueUpdateStatusRequest request) {
        IssueResponse issueResponse = issueService.updateStatus(id, request);
        return ApiResponse.success("Issue status updated successfully", issueResponse);
    }

    @PatchMapping("/issues/{id}/priority")
    @Operation(summary = "Update issue priority")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issue priority updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse updateIssuePriority(@PathVariable Long id,
                                           @Valid @RequestBody IssueUpdatePriorityRequest request) {
        IssueResponse issueResponse = issueService.updatePriority(id, request);
        return ApiResponse.success("Issue priority updated successfully", issueResponse);
    }

    @PostMapping("/issues/{id}/assign")
    @Operation(summary = "Assign issue to a department")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issue assigned successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue or department not found")
    })
    public ApiResponse assignIssue(@PathVariable Long id,
                                   @Valid @RequestBody IssueAssignRequest request) {
        IssueResponse issueResponse = issueService.assignToDepartment(id, request);
        return ApiResponse.success("Issue assigned successfully", issueResponse);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard statistics")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dashboard statistics retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ApiResponse getDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        return ApiResponse.success("Dashboard statistics retrieved successfully", stats);
    }

    @GetMapping("/users")
    @Operation(summary = "List all users")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Users retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ApiResponse getUsers(@RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "20") int size,
                                @RequestParam(defaultValue = "createdAt") String sortBy,
                                @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<UserResponse> users = userService.getAllUsers(page, size, sortBy, sortDir);
        return ApiResponse.success("Users retrieved successfully", users);
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Toggle or update user role")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User role updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ApiResponse updateUserRole(@PathVariable Long id,
                                      @Valid @RequestBody UserUpdateRoleRequest request) {
        UserResponse userResponse = userService.updateUserRole(id, request);
        return ApiResponse.success("User role updated successfully", userResponse);
    }

    private IssueStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return IssueStatus.valueOf(status.toUpperCase());
    }

    private Priority parsePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return null;
        }
        return Priority.valueOf(priority.toUpperCase());
    }

    private Category parseCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        return Category.valueOf(category.toUpperCase());
    }
}
