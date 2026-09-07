import { renderToString } from 'react-dom/server'
import Site from './site/Site'

/** Rendered at build time so crawlers and link previews get real HTML
 *  instead of an empty root div. */
export function render() {
  return renderToString(<Site />)
}
