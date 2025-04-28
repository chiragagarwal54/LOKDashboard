package com.lokdashboard.dashboard.config;

import com.lokdashboard.dashboard.service.VisitorTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

/**
 * Interceptor to track visitors and their activities
 */
@Component
@AllArgsConstructor
@Slf4j
public class VisitorTrackingInterceptor implements HandlerInterceptor {

    private final VisitorTrackingService visitorTrackingService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // Skip tracking for static resources and favicon
        String path = request.getRequestURI();
        if (shouldSkipTracking(path)) {
            return;
        }
        
        try {
            visitorTrackingService.trackVisitor(request, response, path);
        } catch (Exception e) {
            // We don't want tracking issues to affect the application
            log.error("Error tracking visitor: {}", e.getMessage(), e);
        }
    }
    
    private boolean shouldSkipTracking(String path) {
        return path.contains("/static/") || 
               path.contains("/css/") || 
               path.contains("/js/") || 
               path.contains("/images/") || 
               path.contains("/favicon.ico") || 
               path.contains("/h2-console/");
    }
} 