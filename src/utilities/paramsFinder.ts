import { stringHasValue } from '@/utilities/string'

export function findParamValues(url: string, path: string, paramName: string): (string | undefined)[] {
  const optionalParamRegex = new RegExp(`(:\\?${paramName})(?=\\W|$)`, 'g')
  const requiredParamRegex = new RegExp(`(:${paramName})(?=\\W|$)`, 'g')
  const regexPattern = new RegExp(path.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)'), 'g')

  const matches = Array.from(url.matchAll(regexPattern))

  return matches.flatMap(([, ...values]) => values.map(value => stringHasValue(value) ? value : undefined))
}