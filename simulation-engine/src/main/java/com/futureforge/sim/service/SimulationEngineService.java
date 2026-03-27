package com.futureforge.sim.service;

import com.futureforge.sim.model.WorldState;
import com.futureforge.sim.repository.WorldStateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationEngineService {

    private final WorldStateRepository stateRepository;

    @Transactional
    public WorldState initializeSimulation() {
        stateRepository.deleteAll();
        WorldState initialState = new WorldState();
        log.info("Simulation initialized at t=0");
        return stateRepository.save(initialState);
    }

    @Transactional
    public WorldState advanceTimeStep(String externalEvent) {
        WorldState currentState = stateRepository.findTopByOrderByTimeStepDesc()
                .orElseGet(this::initializeSimulation);

        WorldState nextState = new WorldState();
        nextState.setTimeStep(currentState.getTimeStep() + 1);
        
        // --- Feedback Loop Mechanics (Dummy Logic for now until Agent Integration) ---
        // Constraints: Values bounded between 0.0 and 1.0
        double sentimentDelta = (Math.random() - 0.5) * 0.1;
        double econDelta = (Math.random() - 0.5) * 0.1;
        
        if (externalEvent != null && !externalEvent.trim().isEmpty()) {
            nextState.setRecentEvent("Trigger: " + externalEvent);
            // Chaos mode impacts
            if (externalEvent.toLowerCase().contains("breach")) {
                sentimentDelta -= 0.3;
                econDelta -= 0.2;
            } else if (externalEvent.toLowerCase().contains("breakthrough")) {
                sentimentDelta += 0.2;
                econDelta += 0.3;
            }
        } else {
            nextState.setRecentEvent("Tick advanced. Lag effects applied.");
        }

        nextState.setPublicSentiment(bound(currentState.getPublicSentiment() + sentimentDelta));
        nextState.setEconomicStability(bound(currentState.getEconomicStability() + econDelta));
        nextState.setRegulatoryStrictness(currentState.getRegulatoryStrictness());
        nextState.setTechnologicalMaturity(bound(currentState.getTechnologicalMaturity() + 0.05)); // Always progressing slightly

        log.info("Advanced to t={}, Event: {}", nextState.getTimeStep(), nextState.getRecentEvent());
        return stateRepository.save(nextState);
    }

    private double bound(double value) {
        return Math.clamp(value, 0.0, 1.0);
    }
    
    public WorldState getCurrentState() {
        return stateRepository.findTopByOrderByTimeStepDesc().orElse(null);
    }
}
