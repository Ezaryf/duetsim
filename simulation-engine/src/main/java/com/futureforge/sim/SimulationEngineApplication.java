package com.futureforge.sim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SimulationEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(SimulationEngineApplication.class, args);
    }
}
