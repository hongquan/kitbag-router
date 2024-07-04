import { createPath } from 'history'
import { App } from 'vue'
import { RouterLink, RouterView } from '@/components'
import { routerInjectionKey, routerRejectionKey } from '@/compositions'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createIsSameHost } from '@/services/createIsSameHost'
import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { createRouterFind } from '@/services/createRouterFind'
import { createRouterHistory } from '@/services/createRouterHistory'
import { routeHookStoreKey, createRouterHooks } from '@/services/createRouterHooks'
import { createRouterReject } from '@/services/createRouterReject'
import { createRouterResolve } from '@/services/createRouterResolve'
import { getInitialUrl } from '@/services/getInitialUrl'
import { getResolvedRouteForUrl } from '@/services/getResolvedRouteForUrl'
import { createRouteHookRunners } from '@/services/hooks'
import { Routes } from '@/types/route'
import { Router, RouterOptions, RouterReject } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { RoutesKey } from '@/types/routesMap'
import { Url, isUrl } from '@/types/url'

type RouterUpdateOptions = {
  replace?: boolean,
}

/**
 * Creates a router instance for a Vue application, equipped with methods for route handling, lifecycle hooks, and state management.
 *
 * @param routes - {@link Routes} An array of route definitions specifying the configuration of routes in the application.
 * Use createRoutes method to create the route definitions.
 * @param options - {@link RouterOptions} for the router, including history mode and initial URL settings.
 * @returns Router instance
 *
 * @example
 * ```ts
 * import { createRoutes, createRouter } from '@kitbag/router'
 *
 * const Home = { template: '<div>Home</div>' }
 * const About = { template: '<div>About</div>' }
 *
 * export const routes = createRoutes([
 *   { name: 'home', path: '/', component: Home },
 *   { name: 'path', path: '/about', component: About },
 * ])
 *
 * const router = createRouter(routes)
 * ```
 */
export function createRouter<const T extends Routes>(routes: T, options: RouterOptions = {}): Router<T> {
  const resolve = createRouterResolve(routes)
  const history = createRouterHistory({
    mode: options.historyMode,
    listener: () => {
      const url = createPath(location)

      set(url)
    },
  })

  const { runBeforeRouteHooks, runAfterRouteHooks } = createRouteHookRunners<T>()
  const {
    hooks,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  } = createRouterHooks()

  async function set(url: string, { replace }: RouterUpdateOptions = {}): Promise<void> {
    history.stopListening()

    const isExternal = !isSameHost(url)

    if (isExternal) {
      return history.update(url, { replace })
    }

    const to = getResolvedRouteForUrl(routes, url) ?? getRejectionRoute('NotFound')
    const from = { ...currentRoute }

    const beforeResponse = await runBeforeRouteHooks({ to, from, hooks })

    switch (beforeResponse.status) {
      // On abort do nothing
      case 'ABORT':
        return

      // On push update the history, and push new route, and return
      case 'PUSH':
        history.update(url, { replace })
        await push(...beforeResponse.to)
        return

      // On reject update the history, the route, and set the rejection type
      case 'REJECT':
        history.update(url, { replace })
        setRejection(beforeResponse.type)
        updateRoute(to)
        break

      // On success update history, set the route, and clear the rejection
      case 'SUCCESS':
        history.update(url, { replace })
        setRejection(null)
        updateRoute(to)
        break

      default:
        throw new Error(`Switch is not exhaustive for before hook response status: ${JSON.stringify(beforeResponse satisfies never)}`)
    }

    const afterResponse = await runAfterRouteHooks({ to, from, hooks })

    switch (afterResponse.status) {
      case 'PUSH':
        await push(...afterResponse.to)
        break

      case 'REJECT':
        setRejection(afterResponse.type)
        break

      case 'SUCCESS':
        break

      default:
        const exhaustive: never = afterResponse
        throw new Error(`Switch is not exhaustive for after hook response status: ${JSON.stringify(exhaustive)}`)
    }

    history.startListening()
  }

  const push: RouterPush<T> = (source: Url | RoutesKey<T>, paramsOrOptions?: Record<string, unknown> | RouterPushOptions, maybeOptions?: RouterPushOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions }
      const url = resolve(source, options)

      return set(url, { replace: options.replace })
    }

    const options: RouterPushOptions = { ...maybeOptions }
    const params: any = paramsOrOptions ?? {}
    const url = resolve(source, params, options)

    return set(url, { replace: options.replace })
  }

  const replace: RouterReplace<T> = (source: Url | RoutesKey<T>, paramsOrOptions?: Record<string, unknown> | RouterReplaceOptions, maybeOptions?: RouterReplaceOptions) => {
    if (isUrl(source)) {
      const options: RouterPushOptions = { ...paramsOrOptions, replace: true }

      return push(source, options)
    }

    const params: any = paramsOrOptions ?? {}
    const options: RouterPushOptions = { ...maybeOptions, replace: true }

    return push(source, params, options)
  }

  const reject: RouterReject = (type) => {
    return setRejection(type)
  }

  const find = createRouterFind(routes)
  const { setRejection, rejection, getRejectionRoute } = createRouterReject(options)
  const notFoundRoute = getRejectionRoute('NotFound')
  const { currentRoute, routerRoute, updateRoute } = createCurrentRoute<T>(notFoundRoute, push)

  history.startListening()

  const initialUrl = getInitialUrl(options.initialUrl)
  const host = options.host ?? createMaybeRelativeUrl(initialUrl).host
  const isSameHost = createIsSameHost(host)
  const initialized = set(initialUrl, { replace: true })

  function install(app: App): void {
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
    app.provide(routerRejectionKey, rejection)
    app.provide(routeHookStoreKey, hooks)

    // We cant technically guarantee that the user registered the same router that they installed
    // So we're making an assumption here that when installing a router its the same as the RegisteredRouter
    app.provide(routerInjectionKey, router as any)
  }

  const router: Router<T> = {
    route: routerRoute,
    resolve,
    push,
    replace,
    reject,
    find,
    refresh: history.refresh,
    forward: history.forward,
    back: history.back,
    go: history.go,
    install,
    initialized,
    isSameHost,
    onBeforeRouteEnter,
    onAfterRouteUpdate,
    onBeforeRouteLeave,
    onAfterRouteEnter,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
  }

  return router
}