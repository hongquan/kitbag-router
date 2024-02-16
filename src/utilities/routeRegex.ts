import { ResolvedRoute } from '@/types'

export function generateRoutePathRegexPattern(route: ResolvedRoute): RegExp {
  const routeRegex = replaceParamSyntaxWithCatchAlls(route.path)

  return new RegExp(`^${routeRegex}$`, 'i')
}

export function generateRouteQueryRegexPatterns(route: ResolvedRoute): RegExp[] {
  const queryParams = new URLSearchParams(route.query)

  return Array
    .from(queryParams.entries())
    .map(([key, value]) => new RegExp(`${key}=${replaceParamSyntaxWithCatchAlls(value)}`, 'i'))
}

function replaceParamSyntaxWithCatchAlls(value: string): string {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  return value.replace(optionalParamRegex, '([^/]*)').replace(requiredParamRegex, '([^/]+)')
}