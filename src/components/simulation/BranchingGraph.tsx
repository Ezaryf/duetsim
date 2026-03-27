"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { gsap } from 'gsap';

interface SimulationNode {
    id: string;
    label: string;
    group: string;
    radius: number;
    prob: number; // Probability weight
}

interface SimulationLink {
    source: string;
    target: string;
    value: number;
}

interface BranchingGraphProps {
    nodes: SimulationNode[];
    links: SimulationLink[];
    onNodeClick?: (node: SimulationNode) => void;
}

export default function BranchingGraph({ nodes, links, onNodeClick }: Readonly<BranchingGraphProps>) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        svg.selectAll("*").remove(); // Clear previous renders

        // Convert links to format d3.forceSimulation expects
        const simulationLinks = links.map(d => Object.create(d));
        const simulationNodes = nodes.map(d => Object.create(d));

        const simulation = d3.forceSimulation(simulationNodes)
            .force("link", d3.forceLink(simulationLinks).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .attr("stroke", "rgba(255,255,255,0.2)")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(simulationLinks)
            .join("line")
            .attr("stroke-width", d => Math.max(2, d.value * 1.5)); // Thickness = Causality

        // Determine color by sentiment
        const getColor = (sentiment: string) => {
            switch(sentiment) {
                case 'positive': return '#10b981'; // Green
                case 'negative': return '#ef4444'; // Red
                case 'chaos': return '#f59e0b'; // Orange
                default: return '#3b82f6'; // Blue (neutral)
            }
        };

        const node = svg.append("g")
            .attr("stroke", "rgba(255,255,255,0.8)")
            .attr("stroke-width", 2)
            .selectAll("circle")
            .data(simulationNodes)
            .join("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => getColor(d.sentiment || 'neutral'))
            .attr("class", d => d.sentiment === 'chaos' ? 'chaos-node' : '')
            .on("click", (event, d) => {
                // Trigger pulse animation locally on click
                gsap.fromTo(event.target, 
                    { strokeWidth: 10, stroke: getColor(d.sentiment) }, 
                    { strokeWidth: 2, stroke: "rgba(255,255,255,0.8)", duration: 1 }
                );
                onNodeClick?.(d as SimulationNode);
            });

        node.append("title")
            .text(d => `${d.label} (Prob: ${d.prob}%)`);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        // GSAP entry animation
        gsap.fromTo(node.nodes(), { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 1, stagger: 0.05, ease: "back.out(1.7)" });

        return () => {
            simulation.stop();
        };
    }, [nodes, links, onNodeClick]);

    return (
        <div ref={containerRef} className="w-full h-[500px] border border-white/10 rounded-2xl bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
