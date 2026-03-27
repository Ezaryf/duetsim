package com.futureforge.sim.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class WorldState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int timeStep; // 0 -> N
    
    // Global constraints and variables
    private double economicStability;
    private double publicSentiment;
    private double regulatoryStrictness;
    private double technologicalMaturity;

    private String recentEvent; 
    
    // Default constructor initialized with base state
    public WorldState() {
        this.timeStep = 0;
        this.economicStability = 0.5;
        this.publicSentiment = 0.5;
        this.regulatoryStrictness = 0.5;
        this.technologicalMaturity = 0.5;
        this.recentEvent = "Simulation Initialized";
    }
}
