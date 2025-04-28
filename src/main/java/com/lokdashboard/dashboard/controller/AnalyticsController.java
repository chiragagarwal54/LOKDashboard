package com.lokdashboard.dashboard.controller;

import com.lokdashboard.dashboard.service.VisitorTrackingService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@AllArgsConstructor
public class AnalyticsController {

    private final VisitorTrackingService visitorTrackingService;

    @GetMapping("/visitors")
    public Map<String, Object> getVisitorStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVisitors", visitorTrackingService.getTotalVisitorCount());
        stats.put("todayVisitors", visitorTrackingService.getTodayVisitorCount());
        stats.put("totalActivities", visitorTrackingService.getTotalActivityCount());
        stats.put("todayActivities", visitorTrackingService.getTodayActivityCount());
        stats.put("activityByEndpoint", visitorTrackingService.getActivityCountByEndpoint());
        return stats;
    }
} 