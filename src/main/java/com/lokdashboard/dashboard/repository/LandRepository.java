package com.lokdashboard.dashboard.repository;

import com.lokdashboard.dashboard.service.Utils;
import com.lokdashboard.dashboard.models.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
@AllArgsConstructor
@Slf4j
public class LandRepository {

    private final JdbcTemplate jdbcTemplate;
    private final Utils utils;
    public void saveLandData(Land land, LocalDate date) {
        log.info("Saving land data for land ID: {}", land.getId());
        Integer checkCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LAND WHERE LAND_ID = '" + land.getId() + "'", Integer.class);
        if(checkCount == 0) {
            jdbcTemplate.update("INSERT INTO land (land_id, owner, last_updated) VALUES (?, ?, ?)", land.getId(), land.getOwner(), land.getLastUpdated());
        } else {
            jdbcTemplate.update("UPDATE land SET owner = ?, last_updated = ? WHERE land_id = ?", land.getOwner(), land.getLastUpdated(), land.getId());
        }

        for(Contribution contribution : land.getContributions()) {
            jdbcTemplate.update("""
                            INSERT INTO contribution (contribution_date, kingdom_id, total_points, kingdom_name, continent, land_id)
                                            VALUES (?, ?, ?, ?, ?, ?)
                                        """,
                    date,
                    contribution.getKingdomId(),
                    contribution.getTotalPoints(),
                    contribution.getKingdomName(),
                    contribution.getContinent(),
                    contribution.getLandId()
            );
        }
    }

    public Land getAllContributionForADay(LocalDate date, String landId) {
        if(!checkIfDataExistsForDate(landId, date)) {
            Land land = utils.getContributions(landId, date, date);
            saveLandData(land, date);
        }

        List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT kingdom_id, kingdom_name, total_points, continent from CONTRIBUTION where land_id = ? and contribution_date = ?", landId, date);
        Land result = new Land();
        result.setId(landId);
        result.setContributions(
                list.stream().map(each -> {
                    Contribution contribution = new Contribution();
                    contribution.setContinent(((Integer) each.get("continent")));
                    contribution.setTotalPoints(((Double) each.get("total_points")));
                    contribution.setKingdomName(each.get("kingdom_name").toString());
                    contribution.setKingdomId(each.get("kingdom_id").toString());
                    contribution.setDate(date);
                    return contribution;

                }).toList());
        result.setId(landId);
        String owner = jdbcTemplate.queryForObject("SELECT owner FROM LAND where land_id = ?", String.class, landId);
        result.setOwner(owner);
        return result;
    }

    public Land getAllContributionForDateRange(LocalDate startDate, LocalDate endDate, String landId) {
        Integer contributionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CONTRIBUTION where land_id = '" + landId + "' and contribution_date >= '" + startDate + "' and contribution_date <= '" + endDate + "'", Integer.class);

        if(contributionCount == 0) {
            Land land = utils.getContributions(landId, startDate, endDate);
            saveLandData(land, startDate);
        }

        List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT kingdom_id, kingdom_name, total_points, continent from CONTRIBUTION where land_id = ? and contribution_date >= ? and contribution_date <= ?", landId, startDate, endDate);
        Land result = new Land();
        result.setId(landId);
        result.setContributions(
                list.stream().map(each -> {
                    Contribution contribution = new Contribution();
                    contribution.setContinent(((Integer) each.get("continent")));
                    contribution.setTotalPoints(((Double) each.get("total_points")));
                    contribution.setKingdomName(each.get("kingdom_name").toString());
                    contribution.setKingdomId(each.get("kingdom_id").toString());
                    return contribution;

                }).toList());
        result.setId(landId);
        return result;
    }

    public ContributionLeaderboard getLeaderboardForADay(LocalDate date) {
        List<Map<String, Object>> list = jdbcTemplate.queryForList("""
                SELECT kingdom_id, kingdom_name, SUM(total_points) as total_cumulative_points 
                FROM contribution 
                WHERE contribution_date = ? 
                GROUP BY kingdom_id, kingdom_name 
                ORDER BY total_cumulative_points DESC 
                LIMIT 10
                """, date);
        ContributionLeaderboard result = new ContributionLeaderboard();
        result.setContributions(
                list.stream().map(each -> {
                    TotalContribution contribution = new TotalContribution();
                    contribution.setTotalPoints((BigDecimal) each.get("total_cumulative_points"));
                    contribution.setKingdomName(each.get("kingdom_name").toString());
                    contribution.setKingdomId(each.get("kingdom_id").toString());
                    return contribution;

                }).toList());
        return result;
    }

    public LandLeaderboard getLandLeaderboardForADay(LocalDate date) {
        List<Map<String, Object>> list = jdbcTemplate.queryForList("""
                SELECT land_id, SUM(total_points) as total_cumulative_points 
                FROM contribution 
                WHERE contribution_date = ? 
                GROUP BY land_id 
                ORDER BY total_cumulative_points DESC 
                LIMIT 10
                """, date);
        LandLeaderboard result = new LandLeaderboard();
        result.setPoints(
                list.stream().map(each -> {
                    LandTotalPoints landTotalPoints = new LandTotalPoints();
                    landTotalPoints.setTotalPoints((BigDecimal) each.get("total_cumulative_points"));
                    landTotalPoints.setLandId(each.get("land_id").toString());
                    String owner = jdbcTemplate.queryForObject("SELECT owner FROM LAND where land_id = ?", String.class, each.get("land_id").toString());
                    landTotalPoints.setOwner(owner);
                    return landTotalPoints;
                }).toList());
        return result;
    }

    public boolean checkIfDataExistsForDate(String landId, LocalDate date) {
        Integer contributionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CONTRIBUTION where land_id = '" + landId + "' and contribution_date = '" + date + "'", Integer.class);
        return contributionCount > 0;
    }
}
