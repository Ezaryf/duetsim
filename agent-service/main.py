from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Emergent Simulator - Agent Cognitive Engine")

class WorldStateContext(BaseModel):
    timeStep: int
    economicStability: float
    publicSentiment: float
    regulatoryStrictness: float
    technologicalMaturity: float
    recentEvent: str

class AgentAction(BaseModel):
    agent_id: str
    action_type: str
    target_parameter: str
    intensity: float
    rationale: str

@app.post("/api/agents/decide/{agent_id}", response_model=AgentAction)
async def get_agent_decision(agent_id: str, context: WorldStateContext):
    """
    Mock endpoint: In a real implementation this hooks to LangGraph & FAISS memory
    to reason about the agent's goals vs the WorldState context.
    """
    if agent_id not in ["founder", "regulator", "public", "competitor"]:
        raise HTTPException(status_code=404, detail="Agent not found")

    action = AgentAction(
        agent_id=agent_id,
        action_type="influence",
        target_parameter="publicSentiment",
        intensity=0.1,
        rationale=f"As {agent_id}, decided to react to: {context.recentEvent}"
    )

    return action

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
