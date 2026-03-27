package com.futureforge.sim.controller;

import com.futureforge.sim.model.WorldState;
import com.futureforge.sim.service.SimulationEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulation")
@CrossOrigin(origins = "*") // For Next.js integration
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationEngineService simulationService;

    @PostMapping("/init")
    public ResponseEntity<WorldState> initialize() {
        return ResponseEntity.ok(simulationService.initializeSimulation());
    }

    @PostMapping("/tick")
    public ResponseEntity<WorldState> advanceTick(@RequestParam(required = false) String event) {
        return ResponseEntity.ok(simulationService.advanceTimeStep(event));
    }

    @GetMapping("/state")
    public ResponseEntity<WorldState> getState() {
        WorldState state = simulationService.getCurrentState();
        return state != null ? ResponseEntity.ok(state) : ResponseEntity.notFound().build();
    }
}
