package com.lokdashboard.dashboard.models;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LandTotalPoints {
    private String landId;
    private BigDecimal totalPoints;
    private String owner;
}
