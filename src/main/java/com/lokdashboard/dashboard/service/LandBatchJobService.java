package com.lokdashboard.dashboard.service;

import com.lokdashboard.dashboard.models.BadLand;
import com.lokdashboard.dashboard.models.BatchJobStatus;
import com.lokdashboard.dashboard.models.Land;
import com.lokdashboard.dashboard.repository.BatchJobRepository;
import com.lokdashboard.dashboard.repository.LandRepository;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class LandBatchJobService {

    private final LandRepository landRepository;
    private final BatchJobRepository batchJobRepository;
    private final Utils utils;

    /**
     * Run when the application starts up to check for and run today's batch job if needed
     */
    @PostConstruct
    public void init() {
        log.info("Initializing batch job checker at application startup");
        new Thread(this::checkAndRetryBatchJob).start();
    }
    
    /**
     * Run daily at 6:30 UTC to collect land contributions for all lands
     */
    @Scheduled(cron = "0 30 6 * * ?", zone = "UTC")
    public void runDailyBatchJob() {
        LocalDate yesterday = LocalDate.now(java.time.Clock.systemUTC()).minusDays(1);
        log.info("Starting daily batch job at for date {}", yesterday);
        // List of land IDs to process
        int start_land_id = 132768;
        int end_land_id = 165535;
        try {
            int successCount = 0;
            int totalCount = 0;
            List<String> bad_lands = batchJobRepository.getAllBadLandIds();
            log.info("Fetch the list of bad lands from the database, total: {}", bad_lands.size());
            for (Integer landId = start_land_id; landId <= end_land_id; landId++) {
                // Skip bad lands
                if (bad_lands.contains(landId.toString())) {
                    log.info("Skipping bad land: {}", landId);
                    continue;
                }
                
                totalCount++;
                
                try {
                    checkLandDataAndSave(landId.toString(), yesterday);
                    
                    successCount++;
                    log.info("Processed land ID: {}, total processed count now : {}", landId, successCount);
                } catch (Exception e) {
                    log.error("Error processing land {}: {}", landId, e.getMessage(), e);
                }
            }
            
            // Save job status
            batchJobRepository.saveBatchJobStatus(new BatchJobStatus(
                yesterday,
                LocalDateTime.now(), 
                "SUCCESS", 
                String.format("Processed %d/%d lands successfully", successCount, totalCount)
            ));
            
            log.info("Completed daily batch job. Processed {}/{} lands", successCount, totalCount);
        } catch (Exception e) {
            log.error("Error in daily batch job: {}", e.getMessage(), e);
            
            // Save job status
            batchJobRepository.saveBatchJobStatus(new BatchJobStatus(
                yesterday,
                LocalDateTime.now(), 
                "FAILED", 
                "Error: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Check at midnight and every 8 hours if today's batch job was successful, retry if not
     * Also runs once at application startup via @PostConstruct
     */
    @Scheduled(cron = "0 0 1/8 * * ?", zone = "UTC")
    public void checkAndRetryBatchJob() {
        log.info("Checking if today's batch job needs to be retried");
        LocalDate yesterday = LocalDate.now(java.time.Clock.systemUTC()).minusDays(1);
        
        BatchJobStatus latestStatus = batchJobRepository.getLatestBatchJobStatusForDate(yesterday);
        
        // If there's no status for today yet or the last status is FAILED, run the batch job
        if (latestStatus == null || "FAILED".equals(latestStatus.getStatus())) {
            log.info("No successful batch job found for today, retrying for date: {}...", yesterday);
            runDailyBatchJob();
        } else {
            log.info("Today's batch job was already successful, no need to retry");
        }
    }

    private void checkLandDataAndSave(String landId, LocalDate date) {
        if(!landRepository.checkIfDataExistsForDate(landId, date)) {
            Land land = utils.getContributions(landId, date, date);
            landRepository.saveLandData(land, date);
        }
    }
} 