import { ENTITIES } from '../data/entities';
import useLocalStorage from './useLocalStorage';
import useRemoteCollection from './useRemoteCollection';

/**
 * Live access to a registered collection (same storage key and seed the owning
 * page uses), so cross-module views always reflect the records users edit.
 * Collections marked `remote` in the registry are loaded from and saved to the API.
 */
export default function useCollection(entityType) {
  const entity = ENTITIES[entityType];
  if (!entity) throw new Error(`Unknown entity type: ${entityType}`);
  // `remote` is fixed per entity type, so the hook order never changes between renders.
  if (entity.remote) return useRemoteCollection(entity); // eslint-disable-line react-hooks/rules-of-hooks
  return useLocalStorage(entity.key, entity.seed);
}
