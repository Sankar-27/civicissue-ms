package com.civicissue.service;

import com.civicissue.dto.auth.AuthResponse;
import com.civicissue.dto.auth.LoginRequest;
import com.civicissue.dto.auth.RegisterRequest;
import com.civicissue.dto.user.UserResponse;
import org.springframework.security.core.Authentication;

public interface AuthService {

    void register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(Authentication authentication);
}
