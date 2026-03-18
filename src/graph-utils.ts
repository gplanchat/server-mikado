/**
 * Utilitaires pour la génération du graphe Mikado (Mermaid, etc.)
 */

import type { Goal, MikadoNode, MikadoGraph } from './model.js';

/** Génère un diagramme Mermaid du graphe Mikado */
export function graphToMermaid(graph: MikadoGraph): string {
  const { goal, nodes } = graph;
  const lines: string[] = ['flowchart TB'];

  // Objectif en bas (double cercle simulé avec subgraph)
  const goalId = `goal_${goal.id}`.replace(/-/g, '_');
  lines.push(`  ${goalId}["🎯 ${goal.title}"]`);

  for (const node of nodes) {
    const nodeId = `node_${node.id}`.replace(/-/g, '_');
    const statusIcon = node.status === 'completed' ? '✅' : node.status === 'failed' ? '❌' : '⏳';
    const label = `${statusIcon} ${node.title}`.replace(/"/g, "'");
    lines.push(`  ${nodeId}["${label}"]`);
  }

  // Flèches : node -> prerequisite (dépendance)
  for (const node of nodes) {
    const nodeId = `node_${node.id}`.replace(/-/g, '_');
    for (const depId of node.dependsOn) {
      const depNode = nodes.find((n) => n.id === depId);
      if (depNode) {
        const depNodeId = `node_${depId}`.replace(/-/g, '_');
        lines.push(`  ${nodeId} --> ${depNodeId}`);
      }
    }
    // Si pas de dépendances, lien vers le goal
    if (node.dependsOn.length === 0) {
      lines.push(`  ${nodeId} --> ${goalId}`);
    }
  }

  return lines.join('\n');
}

/** Retourne les nodes dont tous les prérequis sont complétés */
export function getAvailableSteps(graph: MikadoGraph): MikadoNode[] {
  const { nodes } = graph;
  const completedIds = new Set(nodes.filter((n) => n.status === 'completed').map((n) => n.id));

  return nodes.filter((node) => {
    if (node.status !== 'pending') return false;
    return node.dependsOn.every((depId) => completedIds.has(depId));
  });
}
