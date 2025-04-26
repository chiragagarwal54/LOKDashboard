package com.lokdashboard.dashboard.models;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TotalContribution {
    String kingdomId;
    String kingdomName;
    BigDecimal totalPoints;
}
