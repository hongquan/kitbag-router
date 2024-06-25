import { getParamsForString } from '@/services/getParamsForString'
import { Param } from '@/types/paramTypes'
import { Query, QueryParamsWithParamNameExtracted } from '@/types/query'
import { Identity } from '@/types/utilities'

/**
 * Constructs a Query object, which enables assigning types for params.
 *
 * @template TQuery - The string literal type that represents the query.
 * @template TParams - The type of the query parameters associated with the query.
 * @param query - The query string.
 * @param params - The parameters associated with the query, typically as key-value pairs.
 * @returns An object representing the query which includes the query string, its parameters,
 *          and a toString method for getting the query as a string.
 *
 * @example
 * ```ts
 * import { createRoutes, query } from '@kitbag/router'
 *
 * export const routes = createRoutes([
 *   {
 *     name: 'home',
 *     query: query('bar=[bar]', { bar: Boolean }),
 *     component: Home
 *   },
 * ])
 * ```
 */
export function query<TQuery extends string, TParams extends QueryParamsWithParamNameExtracted<TQuery>>(query: TQuery, params: Identity<TParams>): Query<TQuery, TParams>
export function query(query: string, params: Record<string, Param | undefined>): Query {
  return {
    query,
    params: getParamsForString(query, params),
    toString: () => query,
  }
}
