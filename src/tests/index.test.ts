
import type { IWindow } from 'happy-dom'
import { describe, test } from 'vitest'
import { safeLoadScript, safeEvalCode } from '../index'

declare global {
  interface Window extends IWindow { }
}

// TODO
describe('index', () => {
  describe('safeLoadScript', () => {

  })

  describe('safeEvalCode', () => {

  })
})
