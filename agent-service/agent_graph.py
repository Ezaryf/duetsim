from typing import Dict, Any

# Mocking LangGraph Structure for the Cognitive Engine
# In production, this imports from langgraph.graph import StateGraph, END

class MockLangGraphAgent:
    def __init__(self, agent_id: str, goals: str):
        self.agent_id = agent_id
        self.goals = goals

    def perceive_event(self, context: Dict[str, Any]):
        """
        Queries FAISS for past interactions resembling the context,
        reconstructs prompt, invokes LLM to decide strategy.
        """
        # mock decision
        return {
            "agent_id": self.agent_id,
            "action_type": "lobby" if self.agent_id == "founder" else "regulate",
            "target_parameter": "regulatoryStrictness",
            "intensity": 0.5,
            "rationale": f"{self.agent_id} decided to react to {context.get('recentEvent')} to align with {self.goals}"
        }

# Pre-defined agents
agents_registry = {
    "founder": MockLangGraphAgent("founder", "maximize growth fast"),
    "regulator": MockLangGraphAgent("regulator", "minimize risk"),
    "public": MockLangGraphAgent("public", "maximize trust"),
    "competitor": MockLangGraphAgent("competitor", "kill market leader")
}
