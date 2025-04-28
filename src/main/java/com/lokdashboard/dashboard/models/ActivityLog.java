package com.lokdashboard.dashboard.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {
    private Long id;
    private Long visitorId;
    private String endpoint;
    private String method;
    private LocalDateTime timestamp;
    private Integer statusCode;
} 