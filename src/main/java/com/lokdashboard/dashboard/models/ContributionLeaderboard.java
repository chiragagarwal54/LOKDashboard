package com.lokdashboard.dashboard.models;

import lombok.Data;

import java.util.List;

@Data
public class ContributionLeaderboard {
    List<TotalContribution> contributions;
}
