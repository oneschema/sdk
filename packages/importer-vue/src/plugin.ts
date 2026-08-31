import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"
import { App } from "vue"
import { version } from "../package.json"

export const ONESCHEMA_IMPORTER_KEY = "os-importer"

export class OneSchemaPlugin {
  constructor(private initOptions: OneSchemaParams) {
    this.install = this.install.bind(this)
  }

  install(app: App) {
    const importer = new OneSchemaImporterClass({
      ...this.initOptions,
    })
    importer.setClient("Vue", version)
    app.provide(ONESCHEMA_IMPORTER_KEY, importer)

    // The importer holds a window message listener and, with manageDOM, an
    // iframe, neither of which Vue owns. Vue 3.3 has no app unmount hook, so
    // the release hangs off unmount itself; destroy() is idempotent.
    const unmount = app.unmount.bind(app)
    app.unmount = () => {
      importer.destroy()
      unmount()
    }
  }
}
