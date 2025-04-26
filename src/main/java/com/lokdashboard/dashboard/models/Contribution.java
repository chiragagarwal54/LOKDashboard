package com.lokdashboard.dashboard.models;

import lombok.Data;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;


@Data
@Setter
public class Contribution {
    LocalDate date;
    String kingdomId;
    Double totalPoints;
    String kingdomName;
    Integer continent;
    String landId;
}
