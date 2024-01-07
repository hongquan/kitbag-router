import { describe, expect, test } from 'vitest'
import { getInitialUrl } from '@/utilities/getInitialUrl'

describe('getInitialUrl', () => {
  test('throws error if initial route is not set', () => {
    expect(() => getInitialUrl()).toThrowError('initialUrl must be set if window.location is unavailable')
  })
})