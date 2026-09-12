package com.civicissue.controller;

import com.civicissue.dto.ApiResponse;
import com.civicissue.dto.comment.CommentRequest;
import com.civicissue.dto.comment.CommentResponse;
import com.civicissue.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/comments")
@Tag(name = "Comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a comment to an issue")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Comment added successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse addComment(
            @Parameter(description = "Issue ID") @PathVariable Long issueId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {
        CommentResponse commentResponse = commentService.addComment(issueId, request, authentication);
        return ApiResponse.success("Comment added successfully", commentResponse);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get comments for an issue")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comments retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ApiResponse getComments(
            @Parameter(description = "Issue ID") @PathVariable Long issueId) {
        List<CommentResponse> comments = commentService.getCommentsForIssue(issueId);
        return ApiResponse.success("Comments retrieved successfully", comments);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete a comment (admin or comment author)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Comment not found")
    })
    public ApiResponse deleteComment(
            @Parameter(description = "Issue ID") @PathVariable Long issueId,
            @Parameter(description = "Comment ID") @PathVariable Long commentId,
            Authentication authentication) {
        commentService.deleteComment(issueId, commentId, authentication);
        return ApiResponse.success("Comment deleted successfully");
    }
}
