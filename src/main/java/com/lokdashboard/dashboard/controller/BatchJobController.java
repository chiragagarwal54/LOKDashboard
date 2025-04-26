package com.lokdashboard.dashboard.controller;

import com.lokdashboard.dashboard.models.BadLand;
import com.lokdashboard.dashboard.models.BatchJobStatus;
import com.lokdashboard.dashboard.repository.BatchJobRepository;
import com.lokdashboard.dashboard.service.LandBatchJobService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/batch")
@AllArgsConstructor
public class BatchJobController {

    private final LandBatchJobService batchJobService;
    private final BatchJobRepository batchJobRepository;

    @PostMapping("/trigger")
    public String triggerBatchJob() {
        batchJobService.runDailyBatchJob();
        return "Batch job triggered successfully";
    }

    @GetMapping("/status/{date}")
    public BatchJobStatus getBatchJobStatus(@PathVariable LocalDate date) {
        return batchJobRepository.getLatestBatchJobStatusForDate(date);
    }

    @GetMapping("/status/today")
    public BatchJobStatus getTodayBatchJobStatus() {
        return batchJobRepository.getLatestBatchJobStatusForDate(LocalDate.now());
    }
    
    @GetMapping("/badlands")
    public List<String> getBadLands() {
        return batchJobRepository.getAllBadLandIds();
    }
} 