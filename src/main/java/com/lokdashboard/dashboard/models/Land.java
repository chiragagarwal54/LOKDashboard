package com.lokdashboard.dashboard.models;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class Land {
    String id;
    String owner;
    LocalDate lastUpdated;
    List<Contribution> contributions;
}
