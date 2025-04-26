package com.lokdashboard.dashboard.controller;

import com.lokdashboard.dashboard.models.ContributionLeaderboard;
import com.lokdashboard.dashboard.models.Land;
import com.lokdashboard.dashboard.models.LandLeaderboard;
import com.lokdashboard.dashboard.repository.LandRepository;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Date;

@RestController
@RequestMapping("/land")
@AllArgsConstructor
public class LandPointsController {

    public final LandRepository landRepository;
    @GetMapping("/{landId}/{date}")
    public Land getLandDetails(@PathVariable String landId, @PathVariable LocalDate date) {
        return landRepository.getAllContributionForADay(date, landId);
    }

    @GetMapping("/contributionLeaderboard/{date}")
    public ContributionLeaderboard getContributionLeaderboard(@PathVariable LocalDate date) {
        return landRepository.getLeaderboardForADay(date);
    }

    @GetMapping("/landLeaderboard/{date}")
    public LandLeaderboard getLandLeaderboard(@PathVariable LocalDate date) {
        return landRepository.getLandLeaderboardForADay(date);
    }

}
