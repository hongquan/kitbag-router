import { createBrowserHistory, createHashHistory, createMemoryHistory, createPath, History } from 'history'
import { isBrowser } from '@/utilities/isBrowser'

type NavigationPushOptions = {
  replace?: boolean,
}

type NavigationUpdate = (url: string, options?: NavigationPushOptions) => void
type NavigationRefresh = () => void

export type RouterHistory = History & {
  update: NavigationUpdate,
  refresh: NavigationRefresh,
}

export type RouterHistoryMode = 'auto' | 'browser' | 'memory' | 'hash'

type RouterHistoryOptions = {
  mode?: RouterHistoryMode,
}

export function createRouterHistory({ mode }: RouterHistoryOptions = {}): RouterHistory {
  const history = createHistory(mode)

  const update: NavigationUpdate = (url, options) => {
    if (options?.replace) {
      return history.replace(url)
    }

    history.push(url)
  }

  const refresh: NavigationRefresh = () => {
    const url = createPath(history.location)

    return history.replace(url)
  }

  return {
    ...history,
    update,
    refresh,
  }
}

function createHistory(mode: RouterHistoryMode = 'auto'): History {
  switch (mode) {
    case 'auto':
      return isBrowser() ? createBrowserHistory() : createMemoryHistory()
    case 'browser':
      return createBrowserHistory()
    case 'memory':
      return createMemoryHistory()
    case 'hash':
      return createHashHistory()
    default:
      const exhaustive: never = mode
      throw new Error(`createHistory missing case for mode: ${exhaustive}`)
  }
}