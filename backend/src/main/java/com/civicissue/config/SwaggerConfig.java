package com.civicissue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.tags.Tag;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI civicIssueOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CivicIssue Management API")
                        .description("REST API for the CivicIssue civic issue reporting and management platform")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CivicIssue Team")
                                .email("support@civicissue.com")))
                .tags(List.of(
                        new Tag().name("Auth").description("Authentication and authorization endpoints"),
                        new Tag().name("Users").description("User management endpoints"),
                        new Tag().name("Issues").description("Issue reporting and management endpoints"),
                        new Tag().name("Departments").description("Department management endpoints"),
                        new Tag().name("Comments").description("Issue comments endpoints"),
                        new Tag().name("Dashboard").description("Dashboard and analytics endpoints"),
                        new Tag().name("Notifications").description("Notification management endpoints"),
                        new Tag().name("Admin").description("Admin panel endpoints")));
    }
}
