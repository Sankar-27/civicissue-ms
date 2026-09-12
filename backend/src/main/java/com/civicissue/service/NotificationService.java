package com.civicissue.service;

import com.civicissue.dto.notification.NotificationResponse;
import com.civicissue.enums.NotificationType;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface NotificationService {

    void createNotification(Long userId, String title, String message,
                            NotificationType type, Long issueId);

    List<NotificationResponse> getUserNotifications(Authentication authentication);

    List<NotificationResponse> getUserNotifications(String email);

    long getUnreadCount(Authentication authentication);

    long getUnreadCount(String email);

    NotificationResponse markAsRead(Long id, Authentication authentication);

    void markAsRead(Long notificationId);

    void markAllAsRead(Authentication authentication);

    void markAllAsRead(String email);
}
