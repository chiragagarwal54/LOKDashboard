package com.lokdashboard.dashboard.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Service for making API calls with rate limiting
 */
@Service
@Slf4j
public class ApiService {

    private final RestTemplate restTemplate;

    @Value("${api.rate-limit.tokens-per-period:60}")
    private int tokensPerPeriod;

    @Value("${api.rate-limit.period-in-seconds:60}")
    private int periodInSeconds;
    @Value("${api.retry.max-attempts:5}")
    private int maxRetryAttempts;
    
    @Value("${api.retry.forbidden-wait-seconds:60}")
    private int forbiddenWaitSeconds;
    
    // Single global rate limiter for all API calls
    private final AtomicReference<Bucket> rateLimiter = new AtomicReference<>();
    
    public ApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    @PostConstruct
    public void init() {
        // Create the rate limiter with specified tokens per period
        Bandwidth limit = Bandwidth.classic(tokensPerPeriod, Refill.intervally(tokensPerPeriod, Duration.ofSeconds(periodInSeconds)));
        Bucket bucket = Bucket.builder().addLimit(limit).build();
        rateLimiter.set(bucket);
        log.info("Rate limiter initialized: {} requests per {} seconds", tokensPerPeriod, periodInSeconds);
    }

    /**
     * Make an API request with rate limiting
     * 
     * @param uri The URI to request
     * @param responseType The expected response type
     * @return The response entity
     */
    public <T> ResponseEntity<T> get(URI uri, Class<T> responseType) {
        return get(uri, responseType, 0);
    }
    
    /**
     * Make an API request with rate limiting and retry logic
     * 
     * @param uri The URI to request
     * @param responseType The expected response type
     * @param retryCount Current retry count
     * @return The response entity
     */
    private <T> ResponseEntity<T> get(URI uri, Class<T> responseType, int retryCount) {
        // Get the current bucket from atomic reference
        Bucket bucket = rateLimiter.get();
        
        // Try to consume a token
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (!probe.isConsumed()) {
            // Calculate wait time in milliseconds (from nanoseconds)
            long waitTimeMillis = TimeUnit.NANOSECONDS.toMillis(probe.getNanosToWaitForRefill());
            log.warn("Rate limit exceeded for {}. Waiting for {} ms before retry", uri.getHost(), waitTimeMillis);
            
            try {
                // Add a small buffer to ensure tokens are available when we retry
                long bufferTime = Math.max(100, waitTimeMillis / 10);
                TimeUnit.MILLISECONDS.sleep(waitTimeMillis + bufferTime);
                
                // Try again after waiting
                return get(uri, responseType, retryCount);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Thread interrupted while waiting for rate limit", e);
            }
        }
        
        // We have a token, make the request
        log.info("Making API request to {} (remaining tokens: {})", uri, probe.getRemainingTokens());
        
        try {
            return restTemplate.getForEntity(uri, responseType);
        } catch (HttpClientErrorException e) {
            // Handle 403 Forbidden specifically
            if (e.getStatusCode() == HttpStatus.FORBIDDEN) {
                if (retryCount >= maxRetryAttempts) {
                    log.error("Giving up after {} retries for API call to {}", maxRetryAttempts, uri);
                    throw e;
                }
                
                int waitTime = forbiddenWaitSeconds;
                log.warn("Received 403 Forbidden from {}. Retry {}/{}. Waiting for {} seconds before retry", 
                        uri, (retryCount + 1), maxRetryAttempts, waitTime);
                
                try {
                    TimeUnit.SECONDS.sleep(waitTime);
                    // Try again with incremented retry count
                    return get(uri, responseType, retryCount + 1);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted while waiting to retry after 403", ie);
                }
            }
            
            // For other HTTP errors, just rethrow
            throw e;
        }
    }
} 