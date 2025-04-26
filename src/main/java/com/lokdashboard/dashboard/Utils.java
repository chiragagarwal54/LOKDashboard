package com.lokdashboard.dashboard;

import com.lokdashboard.dashboard.models.Contribution;
import com.lokdashboard.dashboard.models.Land;
import com.lokdashboard.dashboard.service.ApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class Utils {

    private final ApiService apiService;

    public Land getContributions(String landId, LocalDate startDate, LocalDate endDate) {
        if(endDate.isBefore(startDate)) {
            throw new RuntimeException("End date before start date");
        }

        if(endDate.isAfter(startDate.plusDays(7))) {
            throw new RuntimeException("Interval should be max of 7 days");
        }
        log.info("Fetching contributions from lok for land ID: {} from {} to {}", landId, startDate, endDate);
        String baseURL = "https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?";
        URI uri = UriComponentsBuilder.fromUri(URI.create(baseURL))
                .queryParam("landId", landId)
                .queryParam("from", startDate.toString())
                .queryParam("to", endDate.toString())
                .build().encode().toUri();

        // Use ApiService for rate-limited API calls
        ResponseEntity<Map> responseEntity = apiService.get(uri, Map.class);
        Map<String, Object> response = responseEntity.getBody();
        
        if (response == null) {
            log.error("Received null response from API for land ID: {}", landId);
            throw new RuntimeException("Null response from API for land ID: " + landId);
        }

        List<Contribution> listOfContributions = new ArrayList<>();
        Land land = new Land();
        for(Map.Entry<String, Object> entry : response.entrySet()) {
            if(entry.getKey().equals("owner")) {
                Object owner = entry.getValue();
                if (owner != null) {
                    land.setOwner(owner.toString());
                }
            } else if(entry.getKey().equals("contribution")) {
                List<Map<String, Object>> contributions = (List)entry.getValue();
                if (contributions != null) {
                    for(Map<String, Object> eachContribution : contributions) {
                        Contribution contribution = new Contribution();
                        contribution.setKingdomId(eachContribution.get("kingdomId").toString());
                        
                        Object totalPoints = eachContribution.get("total");
                        if(totalPoints instanceof Integer) {
                            contribution.setTotalPoints(((Number) eachContribution.get("total")).doubleValue());
                        } else {
                            contribution.setTotalPoints(((double) eachContribution.get("total")));
                        }
                        
                        contribution.setKingdomName(eachContribution.get("name").toString());
                        contribution.setContinent(((Integer) eachContribution.get("continent")));
                        contribution.setLandId(landId);
                        listOfContributions.add(contribution);
                    }
                }
            }
        }
        land.setContributions(listOfContributions);
        land.setId(landId);
        land.setLastUpdated(endDate);
        return land;
    }
}
