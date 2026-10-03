import { common } from './common'
import { status } from './status'
import { nav } from './nav'
import a11y from './a11y'
import dashboard from './dashboard'
import auth from './auth'
import citizen from './citizen'
import errors from './errors'

/** English dictionary — flattened dot-notation keys. */
export const en: Record<string, string> = {
  ...common,
  ...status,
  ...nav,
  ...a11y,
  ...dashboard,
  ...auth,
  ...citizen,
  ...errors,
}
