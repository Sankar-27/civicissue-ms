package com.civicissue.controller;

import com.civicissue.dto.ApiResponse;
import com.civicissue.dto.issue.IssueCreateRequest;
import com.civicissue.dto.issue.IssueListResponse;
import com.civicissue.dto.issue.IssueResponse;
import com.civicissue.dto.issue.TimelineEventResponse;
import com.civicissue.enums.IssueStatus;
import com.civicissue.service.IssueService;
import com.civicissue.service.IssueTimelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@Tag(name = "Issues")
public class IssueController {

    private final IssueService issueService;
    private final IssueTimelineService issueTimelineService;

    public IssueController(IssueService issueService, IssueTimelineService issueTimelineService) {
        this.issueService = issueService;
        this.issueTimelineService = issueTimelineService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new issue")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Issue created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ApiResponse createIssue(
            @RequestPart("request") @Valid IssueCreateRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication authentication) {
        IssueResponse issueResponse = issueService.createIssue(request, image, authentication);
        return ApiResponse.success("Issue created successfully", issueResponse);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user's issues")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issues retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ApiResponse getMyIssues(@RequestParam(required = false) String status,
                                   Authentication authentication) {
        IssueStatus issueStatus = status == null || status.isBlank()
                ? null
                : IssueStatus.valueOf(status.toUpperCase());
        List<IssueListResponse> issues = issueService.getUserIssues(issueStatus, authentication);
        return ApiResponse.success("Issues retrieved successfully", issues);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get issue by ID")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Issue retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse getIssue(
            @Parameter(description = "Issue ID") @PathVariable Long id,
            Authentication authentication) {
        IssueResponse issueResponse = issueService.getIssueById(id, authentication);
        return ApiResponse.success("Issue retrieved successfully", issueResponse);
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get issue activity timeline / history")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Timeline events retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse getIssueTimeline(
            @Parameter(description = "Issue ID") @PathVariable Long id) {
        List<TimelineEventResponse> events = issueTimelineService.getTimeline(id);
        return ApiResponse.success("Timeline events retrieved successfully", events);
    }

    @GetMapping("/nearby")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Find nearby issues")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Nearby issues retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ApiResponse getNearbyIssues(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1000") double radius) {
        List<IssueListResponse> issues = issueService.findNearbyIssues(lat, lon, radius);
        return ApiResponse.success("Nearby issues retrieved successfully", issues);
    }
}
