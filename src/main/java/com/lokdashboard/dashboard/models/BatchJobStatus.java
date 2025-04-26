package com.lokdashboard.dashboard.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchJobStatus {
    private LocalDate date;
    private LocalDateTime executionTime;
    private String status;
    private String message;
} 