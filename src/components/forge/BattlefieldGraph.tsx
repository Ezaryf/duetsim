"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { ForgeEvent } from '@/types';

interface D3Node extends d3.SimulationNodeDatum {
    id: string;
    group: 'core' | 'event';
    label: string;
    radius: number;
    target?: string;
    score?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    value: number;
    impact: number;
}

interface BattlefieldGraphProps {
    readonly entityAName: string;
    readonly entityBName: string;
    readonly scoreA: number;
    readonly scoreB: number;
    readonly events: ForgeEvent[];
    readonly onNodeDrop: (payload: { eventLabel: string; targetId: string }) => void;
}

export default function BattlefieldGraph({ 
    entityAName, entityBName, scoreA, scoreB, events, onNodeDrop 
}: BattlefieldGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Compute nodes & links from simulation events
    const { nodes, links } = useMemo(() => {
        const n: D3Node[] = [
            { id: 'entityA', group: 'core', label: entityAName, radius: 50 + (scoreA / 100) * 30, score: scoreA },
            { id: 'entityB', group: 'core', label: entityBName, radius: 50 + (scoreB / 100) * 30, score: scoreB }
        ];
        const l: D3Link[] = [
            { source: 'entityA', target: 'entityB', value: 1, impact: 0 } // Core clash link
        ];

        events.forEach((evt, i) => {
            const evtId = `evt_${evt.id || i}`;
            let targetId = 'both';
            if (evt.targetEntity === 'A') targetId = 'entityA';
            else if (evt.targetEntity === 'B') targetId = 'entityB';

            n.push({ id: evtId, group: 'event', label: evt.label, radius: Math.abs(evt.impact) * 2 + 10, target: targetId });
            
            if (targetId === 'both') {
                l.push(
                    { source: evtId, target: 'entityA', value: 3, impact: evt.impact },
                    { source: evtId, target: 'entityB', value: 3, impact: evt.impact }
                );
            } else {
                l.push({ source: evtId, target: targetId, value: 3, impact: evt.impact });
            }
        });

        return { nodes: n, links: l };
    }, [entityAName, entityBName, scoreA, scoreB, events]);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);
        
        svg.selectAll("*").remove(); // Clear previous render

        // Background grid for parallax
        const grid = svg.append("g").attr("class", "bg-grid");
        for (let i = 0; i < width; i += 100) {
            grid.append("line").attr("x1", i).attr("y1", 0).attr("x2", i).attr("y2", height).attr("stroke", "rgba(255,255,255,0.02)");
        }
        for (let i = 0; i < height; i += 100) {
            grid.append("line").attr("x1", 0).attr("y1", i).attr("x2", width).attr("y2", i).attr("stroke", "rgba(255,255,255,0.02)");
        }

        // Force Simulation Configuration (The War Engine Physics)
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius((d: any) => d.radius + 20));

        // Draw Links
        const link = svg.append("g")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", d => {
                if (d.impact > 0) return "#10b981"; // Positive wave
                if (d.impact < 0) return "#ef4444"; // Damage wave
                return "rgba(255,255,255,0.2)"; // Clash zone
            })
            .attr("stroke-width", d => Math.max(2, Math.abs(d.impact) || 4));

        // Core visual mappings
        const getColor = (d: D3Node) => {
            if (d.id === 'entityA') return "#06b6d4";
            if (d.id === 'entityB') return "#f43f5e";
            return "#6366f1"; // Event node
        };

        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            // HTML5 Drag Drop listeners for nodes
            .on("dragover", (event) => event.preventDefault())
            .on("drop", (event, d) => {
                event.preventDefault();
                const payloadStr = event.dataTransfer?.getData("text/plain");
                if (payloadStr) {
                    onNodeDrop({ eventLabel: payloadStr, targetId: d.id });
                    
                    // Cinematic Explosion on Drop
                    gsap.fromTo(event.target, 
                        { scale: 1.5, fill: "#fff" }, 
                        { scale: 1, fill: getColor(d), duration: 0.8, ease: "bounce.out" }
                    );

                    // Ripple Cascade Effect
                    const ripple = svg.append("circle")
                        .attr("cx", d.x || width/2)
                        .attr("cy", d.y || height/2)
                        .attr("r", d.radius || 40)
                        .attr("fill", "none")
                        .attr("stroke", getColor(d))
                        .attr("stroke-width", 6)
                        .style("filter", "url(#glow)");

                    gsap.to(ripple.node(), {
                        attr: { r: (d.radius || 40) + 150, "stroke-width": 0 },
                        opacity: 0,
                        duration: 1.2,
                        ease: "power2.out",
                        onComplete: () => { ripple.remove(); }
                    });
                }
            })
            .call(d3.drag<SVGGElement, D3Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended) as any);

        // Glow filters
        const defs = svg.append("defs");
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        nodeGroup.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => getColor(d))
            .attr("stroke", "rgba(255,255,255,0.4)")
            .attr("stroke-width", 3)
            .style("filter", "url(#glow)");

        nodeGroup.append("text")
            .text(d => d.label)
            .attr("dy", d => d.group === 'core' ? 5 : 4)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", d => d.group === 'core' ? "18px" : "12px")
            .attr("font-weight", "bold")
            .attr("font-family", "system-ui")
            .attr("pointer-events", "none");

        nodeGroup.append("title")
            .text(d => d.label);

        // Tick simulation
        simulation.on("tick", () => {
            link
                .attr("x1", d => (d.source as D3Node).x!)
                .attr("y1", d => (d.source as D3Node).y!)
                .attr("x2", d => (d.target as D3Node).x!)
                .attr("y2", d => (d.target as D3Node).y!);

            nodeGroup
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return () => {
            simulation.stop();
        };
    }, [nodes, links, onNodeDrop]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 z-0 overflow-hidden">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
