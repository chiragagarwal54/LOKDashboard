package com.lokdashboard.dashboard.service;

import com.lokdashboard.dashboard.models.ActivityLog;
import com.lokdashboard.dashboard.models.VisitorLog;
import com.lokdashboard.dashboard.repository.VisitorRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
@Slf4j
public class VisitorTrackingService {

    private final VisitorRepository visitorRepository;

    /**
     * Track a visitor and their activity
     */
    public void trackVisitor(HttpServletRequest request, HttpServletResponse response, String endpoint) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        // Track visitor
        VisitorLog visitor = visitorRepository.findByIpAddress(ipAddress);
        LocalDateTime now = LocalDateTime.now();
        
        if (visitor == null) {
            // New visitor
            visitor = VisitorLog.builder()
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .firstVisitTime(now)
                    .lastVisitTime(now)
                    .visitCount(1)
                    .build();
            visitor = visitorRepository.saveVisitor(visitor);
            log.info("New visitor tracked: {}", ipAddress);
        } else {
            // Returning visitor
            visitor.setLastVisitTime(now);
            visitor.setVisitCount(visitor.getVisitCount() + 1);
            visitorRepository.updateVisitor(visitor);
            log.debug("Returning visitor: {}, visit count: {}", ipAddress, visitor.getVisitCount());
        }
        
        // Track activity
        ActivityLog activity = ActivityLog.builder()
                .visitorId(visitor.getId())
                .endpoint(endpoint)
                .method(request.getMethod())
                .timestamp(now)
                .statusCode(response.getStatus())
                .build();
        
        visitorRepository.saveActivity(activity);
        log.debug("Activity logged: {} {}", request.getMethod(), endpoint);
    }
    
    /**
     * Get total visitor count
     */
    public int getTotalVisitorCount() {
        return visitorRepository.getTotalVisitorCount();
    }
    
    /**
     * Get visitor count for today
     */
    public int getTodayVisitorCount() {
        return visitorRepository.getTodayVisitorCount();
    }
    
    /**
     * Get total activity count
     */
    public int getTotalActivityCount() {
        return visitorRepository.getTotalActivityCount();
    }
    
    /**
     * Get activity count for today
     */
    public int getTodayActivityCount() {
        return visitorRepository.getTodayActivityCount();
    }
    
    /**
     * Get activity count by endpoint
     */
    public List<Map<String, Object>> getActivityCountByEndpoint() {
        return visitorRepository.getActivityCountByEndpoint();
    }

    /**
     * Extract the client IP address from the request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // If the IP contains multiple addresses, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip;
    }
} 