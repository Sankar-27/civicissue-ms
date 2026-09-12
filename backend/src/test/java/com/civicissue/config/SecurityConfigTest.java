package com.civicissue.config;

import com.civicissue.dto.dashboard.DashboardStatsResponse;
import com.civicissue.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    void unauthenticatedAdminRequest_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CITIZEN")
    void citizenRoleCannotAccessAdminEndpoint_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRoleCanAccessAdminEndpoint_returns200() throws Exception {
        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalIssues(10)
                .openIssues(3)
                .categoryCounts(List.of())
                .sevenDayTrend(List.of())
                .recentIssues(List.of())
                .build();
        when(dashboardService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isOk());
    }
}
