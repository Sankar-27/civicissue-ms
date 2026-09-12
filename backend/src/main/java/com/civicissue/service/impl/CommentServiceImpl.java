package com.civicissue.service.impl;

import com.civicissue.dto.comment.CommentRequest;
import com.civicissue.dto.comment.CommentResponse;
import com.civicissue.dto.user.UserResponse;
import com.civicissue.entity.postgres.Comment;
import com.civicissue.entity.postgres.Issue;
import com.civicissue.entity.postgres.User;
import com.civicissue.enums.NotificationType;
import com.civicissue.enums.Role;
import com.civicissue.exception.ForbiddenException;
import com.civicissue.exception.ResourceNotFoundException;
import com.civicissue.repository.CommentRepository;
import com.civicissue.repository.IssueRepository;
import com.civicissue.repository.UserRepository;
import com.civicissue.security.CustomUserDetails;
import com.civicissue.service.CommentService;
import com.civicissue.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CommentResponse addComment(Long issueId, CommentRequest request, Authentication authentication) {
        User user = extractUser(authentication);
        return addComment(issueId, request, user.getEmail());
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long issueId, CommentRequest request, String userEmail) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .author(user)
                .issue(issue)
                .build();

        Comment saved = commentRepository.save(comment);

        if (user.getRole() == Role.ADMIN
                && issue.getReportedBy() != null
                && !issue.getReportedBy().getId().equals(user.getId())) {
            notificationService.createNotification(
                    issue.getReportedBy().getId(),
                    "New Comment on Your Issue",
                    "Admin commented on \"" + issue.getTitle() + "\"",
                    NotificationType.COMMENT,
                    issue.getId()
            );
        }

        return toResponse(saved);
    }

    @Override
    public List<CommentResponse> getCommentsForIssue(Long issueId) {
        return getCommentsByIssue(issueId);
    }

    @Override
    public List<CommentResponse> getCommentsByIssue(Long issueId) {
        if (!issueRepository.existsById(issueId)) {
            throw new ResourceNotFoundException("Issue not found with id: " + issueId);
        }
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteComment(Long issueId, Long commentId, Authentication authentication) {
        User user = extractUser(authentication);
        deleteComment(commentId, user.getEmail());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
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

    private CommentResponse toResponse(Comment comment) {
        UserResponse author = UserResponse.builder()
                .id(comment.getAuthor().getId())
                .name(comment.getAuthor().getName())
                .email(comment.getAuthor().getEmail())
                .role(comment.getAuthor().getRole())
                .enabled(comment.getAuthor().isEnabled())
                .createdAt(comment.getAuthor().getCreatedAt())
                .build();

        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(author)
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
