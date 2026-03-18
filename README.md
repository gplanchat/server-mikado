# Mikado MCP Server

Serveur MCP (Model Context Protocol) pour le suivi des tâches de conception et de debug selon la [méthode Mikado](https://coach-agile.com/2022/01/la-methode-mikado/).

La méthode Mikado permet de structurer les refactorings et changements par petites étapes expérimentales : objectif clair, expérimentations avec prérequis, validation des succès et annulation des échecs.

## Prérequis

- Node.js >= 20
- Pour MCP Inspector : Node.js >= 22.7.5

## Installation

### Via GitHub (recommandé)

Aucune installation locale nécessaire. Ajoutez dans `~/.cursor/mcp.json` :

```json
{
  "mcpServers": {
    "mikado": {
      "command": "npx",
      "args": ["-y", "github:gplanchat/server-mikado"]
    }
  }
}
```

`npx` clone le dépôt, installe les dépendances et compile automatiquement au premier lancement.

### Installation locale

```bash
git clone git@github.com:gplanchat/server-mikado.git
cd server-mikado
npm install
npm run build
```

## Utilisation

### Mode stdio (MCP Inspector, Cursor)

```bash
node dist/index.js
```

### Mode Streamable HTTP (MCP Apps)

```bash
node dist/index.js --http
```

Le serveur écoute sur `http://localhost:3000/mcp` par défaut. Pour changer le port :

```bash
MIKADO_HTTP_PORT=8080 node dist/index.js --http
```

## Tester avec MCP Inspector

```bash
npm run inspector
```

Ou manuellement :

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

L'interface web s'ouvre sur `http://localhost:6274`.

## Configuration Cursor

**Avec installation GitHub** (voir section Installation ci-dessus) :

```json
"mikado": {
  "command": "npx",
  "args": ["-y", "github:gplanchat/server-mikado"]
}
```

**Avec installation locale** :

```json
"mikado": {
  "command": "node",
  "args": ["/chemin/vers/server-mikado/dist/index.js"]
}
```

## Stockage des données

Les graphes sont isolés par projet :

1. **`MIKADO_DATA_PATH`** : si défini, ce chemin est utilisé (prioritaire)
2. **Fallback** : `./.mikado/data.json` dans le dossier du projet (cwd)

Quand Cursor lance le serveur MCP, le répertoire courant est le projet ouvert. Chaque projet a donc ses propres graphes dans `.mikado/data.json`.

Pour forcer un chemin explicite :

```bash
MIKADO_DATA_PATH=/chemin/vers/data.json node dist/index.js
```

Vous pouvez ajouter `.mikado/` au `.gitignore` de vos projets si vous ne souhaitez pas versionner les graphes.

## Tools MCP

| Tool | Description |
|------|-------------|
| `mk_create_goal` | Créer un objectif Mikado |
| `mk_add_experiment` | Ajouter une expérimentation avec prérequis optionnels |
| `mk_add_prerequisite` | Ajouter un prérequis à une expérimentation (quand on bloque) |
| `mk_mark_completed` | Marquer une expérimentation comme réussie |
| `mk_mark_failed` | Marquer comme échouée (revert) |
| `mk_list_goals` | Lister les objectifs |
| `mk_get_graph` | Récupérer le graphe (JSON + Mermaid) |
| `mk_list_available_steps` | Lister les étapes sans dépendances non satisfaites |
| `mk_delete_goal` | Supprimer un objectif et ses expérimentations |

## Resources MCP

| URI | Description |
|-----|-------------|
| `mikado://guide` | **Méthode Mikado** : principes, workflow, quand l'utiliser |
| `mikado://integration` | **Intégration agent** : guide pour agents IA (format règle Cursor / skill) |
| `mikado://graph/{goalId}` | Graphe au format JSON |
| `mikado://graph/{goalId}/mermaid` | Graphe en Mermaid |
| `mikado://goals` | Liste des objectifs |

Les resources `mikado://guide` et `mikado://integration` permettent aux agents de comprendre la méthode et de s'intégrer correctement, à l'image d'une règle Cursor ou d'un skill.

## Prompts MCP

| Prompt | Description |
|--------|-------------|
| `mk_suggest_next_step` | Suggérer la prochaine étape à tenter |
| `mk_analyze_blocker` | Aider à décomposer un blocage en prérequis |

## Workflow typique

1. **Créer un objectif** : `mk_create_goal` avec le titre du refactoring
2. **Ajouter la première expérimentation** : `mk_add_experiment` sans prérequis
3. **Tenter l'expérimentation** : si succès → `mk_mark_completed`, si échec → `mk_mark_failed` puis `mk_add_experiment` + `mk_add_prerequisite` pour les prérequis manquants
4. **Consulter les prochaines étapes** : `mk_list_available_steps`
5. **Visualiser le graphe** : `mk_get_graph` ou resource `mikado://graph/{goalId}/mermaid`

## Licence

MIT
