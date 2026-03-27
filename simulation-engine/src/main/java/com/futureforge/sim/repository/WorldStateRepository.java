package com.futureforge.sim.repository;

import com.futureforge.sim.model.WorldState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorldStateRepository extends JpaRepository<WorldState, Long> {
    Optional<WorldState> findTopByOrderByTimeStepDesc();
}
