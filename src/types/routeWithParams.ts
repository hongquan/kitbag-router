import { ExtractParamName } from '@/types/params'
import { Param, ParamGetSet, ParamGetter } from '@/types/paramTypes'
import { Routes } from '@/types/route'
import { RoutesKey, RoutesMap } from '@/types/routesMap'
import { Identity } from '@/types/utilities'
import { MakeOptional } from '@/utilities/makeOptional'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TKey]

export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractRouteParamTypesWithoutLosingOptional<RouteGetByKey<TRoutes, TKey>>

type ExtractRouteParamTypesWithoutLosingOptional<TRoute> = TRoute extends {
  host: { params: infer HostParams extends Record<string, Param> },
  path: { params: infer PathParams extends Record<string, Param> },
  query: { params: infer QueryParams extends Record<string, Param> },
}
  ? ExtractParamTypesWithoutLosingOptional<HostParams & PathParams & QueryParams>
  : Record<string, unknown>

type ExtractParamTypesWithoutLosingOptional<TParams extends Record<string, Param>> = Identity<MakeOptional<{
  [K in keyof TParams as ExtractParamName<K>]: ExtractParamTypeWithoutLosingOptional<TParams[K], K>
}>>

type ExtractParamTypeWithoutLosingOptional<TParam extends Param, TParamKey extends PropertyKey> = TParam extends ParamGetSet<infer Type>
  ? TParamKey extends `?${string}`
    ? Type | undefined
    : Type
  : TParam extends ParamGetter
    ? TParamKey extends `?${string}`
      ? ReturnType<TParam> | undefined
      : ReturnType<TParam>
    : TParamKey extends `?${string}`
      ? string | undefined
      : string