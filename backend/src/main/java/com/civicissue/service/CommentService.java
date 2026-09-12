package com.civicissue.service;

import com.civicissue.dto.comment.CommentRequest;
import com.civicissue.dto.comment.CommentResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface CommentService {

    CommentResponse addComment(Long issueId, CommentRequest request, Authentication authentication);

    CommentResponse addComment(Long issueId, CommentRequest request, String userEmail);

    List<CommentResponse> getCommentsForIssue(Long issueId);

    List<CommentResponse> getCommentsByIssue(Long issueId);

    void deleteComment(Long issueId, Long commentId, Authentication authentication);

    void deleteComment(Long commentId, String userEmail);
}
