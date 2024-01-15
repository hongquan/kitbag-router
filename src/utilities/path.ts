import { Param, Identity, ReplaceAll, MergeParams, ExtractParamName, ExtractPathParamType } from '@/types'
import { getParamsForString } from '@/utilities'

type ParamEnd = '/'

type UnifyParamEnds<
  TPath extends string
> = ReplaceAll<ReplaceAll<TPath, '-', ParamEnd>, '_', ParamEnd>

type ExtractParamsFromPathString<
  TPath extends string,
  TParams extends Record<string, Param | undefined> = Record<never, never>
> = UnifyParamEnds<TPath> extends `${infer Path}${ParamEnd}`
  ? ExtractParamsFromPathString<Path, TParams>
  : UnifyParamEnds<TPath> extends `${string}:${infer Param}${ParamEnd}${infer Rest}`
    ? MergeParams<{ [P in ExtractParamName<Param>]: ExtractPathParamType<Param, TParams> }, ExtractParamsFromPathString<Rest, TParams>>
    : UnifyParamEnds<TPath> extends `${string}:${infer Param}`
      ? { [P in ExtractParamName<Param>]: [ExtractPathParamType<Param, TParams>] }
      : Record<never, never>

type PathParams<T extends string> = {
  [K in keyof ExtractParamsFromPathString<T>]?: Param
}

export type Path<
  T extends string = any,
  P extends PathParams<T> = any
> = {
  path: T,
  params: Identity<ExtractParamsFromPathString<T, P>>,
}

export function path<T extends string, P extends PathParams<T>>(path: T, params: Identity<P>): Path<T, P> {
  return {
    path,
    params: getParamsForString(path, params) as Path<T, P>['params'],
  }
}