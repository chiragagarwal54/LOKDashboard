package com.lokdashboard.dashboard.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadLand {
    private String landId;
    private LocalDateTime discoveredAt;
} 