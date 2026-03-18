/**
 * Modèle de données pour la méthode Mikado
 * @see https://coach-agile.com/2022/01/la-methode-mikado/
 */

/** Objectif final (double cercle en bas du graphe) */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO 8601
}

/** Statut d'une expérimentation */
export type NodeStatus = 'pending' | 'completed' | 'failed';

/** Expérimentation / étape du graphe Mikado */
export interface MikadoNode {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: NodeStatus;
  dependsOn: string[]; // IDs des nodes prérequis
  createdAt: string;
  completedAt?: string;
}

/** Graphe complet = Goal + Nodes */
export interface MikadoGraph {
  goal: Goal;
  nodes: MikadoNode[];
}

/** Schéma de stockage lowdb */
export interface MikadoSchema {
  goals: Goal[];
  nodes: MikadoNode[];
}
