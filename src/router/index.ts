import { RouteRequest, RouteResult, ModelCandidate } from '../types/index.js';
import { ModelRegistry } from './modelRegistry.js';
import { JevRouter } from './jevRouter.js';
import { HeuristicRouter } from './heuristicRouter.js';

export interface IModelRouter {
  route(request: RouteRequest): Promise<RouteResult>;
  registerModel(model: ModelCandidate): void;
  reportModelFailure(modelId: string, error: Error): Promise<RouteResult>;
  getAvailableModels(): ModelCandidate[];
}

export interface RouterFactoryOptions {
  apiKey?: string;
  registry?: ModelRegistry;
  forceHeuristic?: boolean;
}

export function createRouter(options: RouterFactoryOptions = {}): IModelRouter {
  const registry = options.registry || new ModelRegistry();

  if (options.forceHeuristic || (!options.apiKey && !process.env.TYPESAFE_AI_API_KEY)) {
    return new HeuristicRouter(registry);
  }

  return new JevRouter({
    apiKey: options.apiKey,
    registry,
  });
}

export * from './modelRegistry.js';
export * from './heuristicRouter.js';
export * from './jevRouter.js';
