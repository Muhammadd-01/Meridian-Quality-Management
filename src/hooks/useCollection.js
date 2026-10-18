import { ENTITIES } from '../data/entities';
import useLocalStorage from './useLocalStorage';

/**
 * Live access to a registered collection (same storage key and seed the owning
 * page uses), so cross-module views always reflect the records users edit.
 */
export default function useCollection(entityType) {
  const entity = ENTITIES[entityType];
  if (!entity) throw new Error(`Unknown entity type: ${entityType}`);
  return useLocalStorage(entity.key, entity.seed);
}
