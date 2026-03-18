/**
 * Contenu des resources MCP : méthode Mikado et intégration agent
 */

export const MIKADO_METHOD_GUIDE = `# Méthode Mikado

## Description

La méthode Mikado structure les refactorings et changements complexes par petites étapes expérimentales. Elle permet d'avancer vers un objectif tout en gardant le projet toujours fonctionnel.

**Référence** : [La méthode Mikado - Coach Agile](https://coach-agile.com/2022/01/la-methode-mikado/)

## Quand l'utiliser

- Refactoring important (architecture, dépendances, patterns)
- Migrations techniques (framework, base de données, API)
- Débug de problèmes complexes avec plusieurs causes possibles
- Tout changement où "aller droit au but" risquerait de casser le système

## Principes clés

1. **Objectif clair** : Définir précisément le résultat attendu (en bas du graphe)
2. **Expérimentations** : Avancer par petites étapes, essayer des solutions naïves
3. **Valider les succès** : Garder ce qui fonctionne (commit)
4. **Annuler les échecs** : Revenir en arrière (revert), ne jamais laisser le projet cassé
5. **Prérequis** : Quand une étape échoue, identifier ce qui manque et l'ajouter au graphe
6. **Visualisation** : Le graphe montre l'avancement et les dépendances

## Le graphe

- **Objectif** (double cercle) : en bas, c'est la destination
- **Nodes** : chaque expérimentation/étape
- **Flèches** : A → B signifie "B est un prérequis de A" (il faut faire B avant A)
- **Étapes disponibles** : celles dont tous les prérequis sont complétés

## Workflow typique

1. Créer l'objectif avec \`mk_create_goal\`
2. Ajouter la première expérimentation (sans prérequis) avec \`mk_add_experiment\`
3. Tenter l'expérimentation dans le code
4. Si succès → \`mk_mark_completed\`
5. Si échec → \`mk_mark_failed\`, identifier le prérequis manquant, \`mk_add_experiment\` + \`mk_add_prerequisite\`
6. Consulter \`mk_list_available_steps\` pour la suite
7. Répéter jusqu'à atteindre l'objectif
`;

export const AGENT_INTEGRATION_GUIDE = `---
name: mikado-method
description: >-
  Suit et structure les refactorings et changements complexes selon la méthode Mikado.
  Utiliser quand l'utilisateur demande un refactoring, une migration, un debug complexe,
  ou mentionne la méthode Mikado, les graphes de dépendances, ou le travail par petites étapes.
---

# Intégration Agent - Méthode Mikado MCP

## Quand appliquer ce guide

- L'utilisateur demande un **refactoring** important
- L'utilisateur mentionne une **migration** (framework, librairie, API)
- Un **debug** semble avoir plusieurs causes imbriquées
- L'utilisateur cite la **méthode Mikado** ou souhaite structurer un changement par étapes
- Le changement risque de **casser le système** si fait d'un bloc

## Comportement attendu

1. **Proposer la méthode** : Suggérer d'utiliser le MCP Mikado pour structurer le travail
2. **Créer un objectif** : Appeler \`mk_create_goal\` avec un titre clair du changement visé
3. **Décomposer** : Identifier la première étape naïve à tenter, l'ajouter avec \`mk_add_experiment\`
4. **Exécuter par petites étapes** : Une modification à la fois, valider ou annuler
5. **En cas de blocage** : Utiliser \`mk_mark_failed\`, \`mk_add_experiment\` pour le prérequis, \`mk_add_prerequisite\`
6. **Consulter le graphe** : \`mk_get_graph\` ou \`mk_list_available_steps\` pour savoir quoi faire ensuite

## Mapping outils MCP → actions

| Situation | Outil MCP |
|-----------|-----------|
| Démarrer un nouveau refactoring | \`mk_create_goal\` |
| Ajouter une étape à tenter | \`mk_add_experiment\` |
| Étape réussie (à committer) | \`mk_mark_completed\` |
| Étape échouée (à revert) | \`mk_mark_failed\` |
| Identifier un prérequis manquant | \`mk_add_experiment\` + \`mk_add_prerequisite\` |
| Voir les prochaines étapes possibles | \`mk_list_available_steps\` |
| Visualiser le graphe | \`mk_get_graph\` ou resource \`mikado://graph/{goalId}/mermaid\` |
| Lister les objectifs existants | \`mk_list_goals\` |

## Règles d'or

- **Ne jamais laisser le code cassé** : en cas d'échec, revert avant d'ajouter des prérequis
- **Une expérimentation à la fois** : ne pas cumuler plusieurs changements non validés
- **Prérequis = dépendance** : si B bloque A, B doit être fait avant A
- **Toujours fonctionnel** : à tout moment, on peut s'arrêter et livrer

## Ressources utiles

- \`mikado://guide\` : Description complète de la méthode
- \`mikado://integration\` : Ce guide (intégration agent)
- \`mikado://goals\` : Liste des objectifs
- \`mikado://graph/{goalId}/mermaid\` : Graphe visualisable
`;
