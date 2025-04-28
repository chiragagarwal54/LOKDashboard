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
public class VisitorLog {
    private Long id;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime firstVisitTime;
    private LocalDateTime lastVisitTime;
    private int visitCount;
} 