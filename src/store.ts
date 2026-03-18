/**
 * Abstraction stockage avec lowdb (JSON, pas de binaire)
 */

import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import type { Goal, MikadoNode, MikadoSchema } from './model.js';

const defaultDataPath =
  process.env.MIKADO_DATA_PATH ||
  path.join(process.env.HOME || process.env.USERPROFILE || '.', '.mikado-mcp', 'data.json');

function ensureDataDir() {
  const dir = path.dirname(defaultDataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let db: Awaited<ReturnType<typeof JSONFilePreset<MikadoSchema>>> | null = null;

async function getDb() {
  if (!db) {
    ensureDataDir();
    db = await JSONFilePreset<MikadoSchema>(defaultDataPath, {
      goals: [],
      nodes: [],
    });
  }
  return db;
}

export async function getGoals(): Promise<Goal[]> {
  const database = await getDb();
  return database.data.goals;
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  const goals = await getGoals();
  return goals.find((g) => g.id === id);
}

export async function addGoal(goal: Goal): Promise<Goal> {
  const database = await getDb();
  database.data.goals.push(goal);
  await database.write();
  return goal;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const database = await getDb();
  const index = database.data.goals.findIndex((g) => g.id === id);
  if (index === -1) return false;
  database.data.goals.splice(index, 1);
  database.data.nodes = database.data.nodes.filter((n) => n.goalId !== id);
  await database.write();
  return true;
}

export async function getNodes(goalId: string): Promise<MikadoNode[]> {
  const database = await getDb();
  return database.data.nodes.filter((n) => n.goalId === goalId);
}

export async function getNode(goalId: string, nodeId: string): Promise<MikadoNode | undefined> {
  const nodes = await getNodes(goalId);
  return nodes.find((n) => n.id === nodeId);
}

export async function addNode(node: MikadoNode): Promise<MikadoNode> {
  const database = await getDb();
  database.data.nodes.push(node);
  await database.write();
  return node;
}

export async function updateNode(
  goalId: string,
  nodeId: string,
  updates: Partial<Pick<MikadoNode, 'status' | 'description' | 'dependsOn' | 'completedAt'>>
): Promise<MikadoNode | null> {
  const database = await getDb();
  const node = database.data.nodes.find((n) => n.goalId === goalId && n.id === nodeId);
  if (!node) return null;
  Object.assign(node, updates);
  await database.write();
  return node;
}
