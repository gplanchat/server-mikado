/**
 * Configuration du serveur MCP Mikado
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import * as store from './store.js';
import type { Goal, MikadoNode } from './model.js';
import { graphToMermaid, getAvailableSteps } from './graph-utils.js';
import { MIKADO_METHOD_GUIDE, AGENT_INTEGRATION_GUIDE } from './content/guide.js';

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'mikado-mcp-server',
      version: '1.0.0',
      description:
        'Suivi des tâches selon la méthode Mikado pour refactoring, migration et debug. ' +
        'Structurer les changements par petites étapes expérimentales. ' +
        'Lire mikado://guide pour la méthode, mikado://integration pour l\'intégration agent.',
    },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  // --- Tools ---

  server.registerTool(
    'mk_create_goal',
    {
      title: 'Créer un objectif Mikado',
      description: 'Créer un nouvel objectif (goal) pour le graphe Mikado',
      inputSchema: {
        title: z.string().describe('Titre de l\'objectif'),
        description: z.string().optional().describe('Description optionnelle'),
      },
    },
    async ({ title, description }) => {
      const goal: Goal = {
        id: randomUUID(),
        title,
        description,
        createdAt: new Date().toISOString(),
      };
      await store.addGoal(goal);
      return {
        content: [{ type: 'text', text: JSON.stringify({ goal }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_add_experiment',
    {
      title: 'Ajouter une expérimentation',
      description: 'Ajouter une expérimentation (étape) au graphe avec des prérequis optionnels',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
        title: z.string().describe('Titre de l\'expérimentation'),
        description: z.string().optional().describe('Description optionnelle'),
        dependsOn: z.array(z.string()).optional().describe('IDs des nodes prérequis'),
      },
    },
    async ({ goalId, title, description, dependsOn }) => {
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Objectif non trouvé: ${goalId}` }) }],
          isError: true,
        };
      }
      const node: MikadoNode = {
        id: randomUUID(),
        goalId,
        title,
        description,
        status: 'pending',
        dependsOn: dependsOn ?? [],
        createdAt: new Date().toISOString(),
      };
      await store.addNode(node);
      return {
        content: [{ type: 'text', text: JSON.stringify({ node }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_add_prerequisite',
    {
      title: 'Ajouter un prérequis',
      description: 'Ajouter un prérequis à une expérimentation (quand on bloque)',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
        nodeId: z.string().describe('ID de l\'expérimentation'),
        prerequisiteId: z.string().describe('ID du node prérequis à ajouter'),
      },
    },
    async ({ goalId, nodeId, prerequisiteId }) => {
      const node = await store.getNode(goalId, nodeId);
      if (!node) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Expérimentation non trouvée: ${nodeId}` }) }],
          isError: true,
        };
      }
      const deps = [...node.dependsOn];
      if (deps.includes(prerequisiteId)) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Ce prérequis est déjà présent' }) }],
          isError: true,
        };
      }
      deps.push(prerequisiteId);
      const updated = await store.updateNode(goalId, nodeId, { dependsOn: deps });
      return {
        content: [{ type: 'text', text: JSON.stringify({ node: updated }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_mark_completed',
    {
      title: 'Marquer comme réussie',
      description: 'Valider une expérimentation réussie (commit)',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
        nodeId: z.string().describe('ID de l\'expérimentation'),
      },
    },
    async ({ goalId, nodeId }) => {
      const updated = await store.updateNode(goalId, nodeId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      if (!updated) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Expérimentation non trouvée: ${nodeId}` }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ node: updated }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_mark_failed',
    {
      title: 'Marquer comme échouée',
      description: 'Annuler une expérimentation échouée (revert)',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
        nodeId: z.string().describe('ID de l\'expérimentation'),
      },
    },
    async ({ goalId, nodeId }) => {
      const updated = await store.updateNode(goalId, nodeId, { status: 'failed' });
      if (!updated) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Expérimentation non trouvée: ${nodeId}` }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ node: updated }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_list_goals',
    {
      title: 'Lister les objectifs',
      description: 'Lister tous les objectifs Mikado',
      inputSchema: {},
    },
    async () => {
      const goals = await store.getGoals();
      return {
        content: [{ type: 'text', text: JSON.stringify({ goals }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_get_graph',
    {
      title: 'Récupérer le graphe',
      description: 'Récupérer le graphe d\'un objectif (JSON + Mermaid)',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
      },
    },
    async ({ goalId }) => {
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Objectif non trouvé: ${goalId}` }) }],
          isError: true,
        };
      }
      const nodes = await store.getNodes(goalId);
      const graph = { goal, nodes };
      const mermaid = graphToMermaid(graph);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { graph, mermaid },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    'mk_list_available_steps',
    {
      title: 'Lister les étapes disponibles',
      description: 'Lister les étapes sans dépendances non satisfaites (prochaines à tenter)',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
      },
    },
    async ({ goalId }) => {
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Objectif non trouvé: ${goalId}` }) }],
          isError: true,
        };
      }
      const nodes = await store.getNodes(goalId);
      const graph = { goal, nodes };
      const available = getAvailableSteps(graph);
      return {
        content: [{ type: 'text', text: JSON.stringify({ availableSteps: available }, null, 2) }],
      };
    }
  );

  server.registerTool(
    'mk_delete_goal',
    {
      title: 'Supprimer un objectif',
      description: 'Supprimer un objectif et toutes ses expérimentations',
      inputSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
      },
    },
    async ({ goalId }) => {
      const ok = await store.deleteGoal(goalId);
      if (!ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Objectif non trouvé: ${goalId}` }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ deleted: goalId }) }],
      };
    }
  );

  // --- Resources ---

  const graphTemplate = new ResourceTemplate('mikado://graph/{goalId}', {
    list: async () => {
      const goals = await store.getGoals();
      return {
        resources: goals.map((g) => ({
          uri: `mikado://graph/${g.id}`,
          name: `graph-${g.id}`,
          description: `Graphe Mikado: ${g.title}`,
          mimeType: 'application/json',
        })),
      };
    },
  });

  server.registerResource(
    'graph',
    graphTemplate,
    { mimeType: 'application/json' },
    async (uri, variables) => {
      const goalId = (Array.isArray(variables.goalId) ? variables.goalId[0] : variables.goalId) ?? '';
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return { contents: [{ uri: uri.toString(), text: JSON.stringify({ error: 'Objectif non trouvé' }) }] };
      }
      const nodes = await store.getNodes(goalId);
      const graph = { goal, nodes };
      return {
        contents: [{ uri: uri.toString(), text: JSON.stringify(graph, null, 2) }],
      };
    }
  );

  const mermaidTemplate = new ResourceTemplate('mikado://graph/{goalId}/mermaid', {
    list: async () => {
      const goals = await store.getGoals();
      return {
        resources: goals.map((g) => ({
          uri: `mikado://graph/${g.id}/mermaid`,
          name: `graph-${g.id}-mermaid`,
          description: `Graphe Mermaid: ${g.title}`,
          mimeType: 'text/plain',
        })),
      };
    },
  });

  server.registerResource(
    'graph-mermaid',
    mermaidTemplate,
    { mimeType: 'text/plain' },
    async (uri, variables) => {
      const goalId = (Array.isArray(variables.goalId) ? variables.goalId[0] : variables.goalId) ?? '';
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return { contents: [{ uri: uri.toString(), text: 'Objectif non trouvé' }] };
      }
      const nodes = await store.getNodes(goalId);
      const graph = { goal, nodes };
      const mermaid = graphToMermaid(graph);
      return {
        contents: [{ uri: uri.toString(), text: mermaid }],
      };
    }
  );

  server.registerResource(
    'goals',
    'mikado://goals',
    { mimeType: 'application/json' },
    async () => {
      const goals = await store.getGoals();
      return {
        contents: [{ uri: 'mikado://goals', text: JSON.stringify({ goals }, null, 2) }],
      };
    }
  );

  server.registerResource(
    'guide',
    'mikado://guide',
    {
      mimeType: 'text/markdown',
      description: 'Description de la méthode Mikado : principes, workflow, quand l\'utiliser',
    },
    async () => ({
      contents: [{ uri: 'mikado://guide', mimeType: 'text/markdown', text: MIKADO_METHOD_GUIDE }],
    })
  );

  server.registerResource(
    'integration',
    'mikado://integration',
    {
      mimeType: 'text/markdown',
      description: 'Guide d\'intégration pour agents IA (règle Cursor / skill) : quand et comment utiliser le MCP Mikado',
    },
    async () => ({
      contents: [
        { uri: 'mikado://integration', mimeType: 'text/markdown', text: AGENT_INTEGRATION_GUIDE },
      ],
    })
  );

  // --- Prompts ---

  server.registerPrompt(
    'mk_suggest_next_step',
    {
      title: 'Suggérer la prochaine étape',
      description: 'Suggérer la prochaine étape à tenter selon le graphe Mikado',
      argsSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
      },
    },
    async ({ goalId }) => {
      const goal = await store.getGoal(goalId);
      if (!goal) {
        return {
          messages: [{ role: 'user', content: { type: 'text', text: `Objectif non trouvé: ${goalId}` } }],
        };
      }
      const nodes = await store.getNodes(goalId);
      const graph = { goal, nodes };
      const available = getAvailableSteps(graph);
      const text =
        available.length > 0
          ? `Prochaines étapes possibles pour "${goal.title}":\n${available.map((n) => `- ${n.title} (${n.id})`).join('\n')}`
          : `Aucune étape disponible pour l'instant. Toutes les étapes sont terminées ou en attente de prérequis.`;
      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );

  server.registerPrompt(
    'mk_analyze_blocker',
    {
      title: 'Analyser un blocage',
      description: 'Aider à décomposer un blocage en prérequis',
      argsSchema: {
        goalId: z.string().describe('ID de l\'objectif'),
        nodeId: z.string().describe('ID de l\'expérimentation bloquée'),
        blockerDescription: z.string().describe('Description du blocage rencontré'),
      },
    },
    async ({ goalId, nodeId, blockerDescription }) => {
      const node = await store.getNode(goalId, nodeId);
      if (!node) {
        return {
          messages: [{ role: 'user', content: { type: 'text', text: `Expérimentation non trouvée: ${nodeId}` } }],
        };
      }
      const text = `Vous êtes bloqué sur l'expérimentation "${node.title}".

Blocage décrit: ${blockerDescription}

Selon la méthode Mikado, quand une expérimentation échoue:
1. Annulez les modifications (revert)
2. Identifiez ce qui manque: quel prérequis doit être accompli avant ?
3. Ajoutez ce prérequis au graphe avec mk_add_experiment puis mk_add_prerequisite
4. Tentez une autre étape disponible

Posez-vous la question: "Que faut-il faire pour débloquer cette étape ?"`;
      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );

  return server;
}
