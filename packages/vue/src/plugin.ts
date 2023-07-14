import { App } from "vue";
import { version } from "../package.json"
import { OneSchemaImporterClass, OneSchemaParams } from "@oneschema/importer"

function bindPluginMethods(plugin: any, exclude: string[]) {
  Object.getOwnPropertyNames(Object.getPrototypeOf(plugin))
    .filter(method => !exclude.includes(method))
    .forEach(method => (plugin[method] = plugin[method].bind(plugin)));
}

export class OneSchemaPlugin {
  constructor(
    private initOptions : OneSchemaParams
  ) {
    bindPluginMethods(this, ['constructor'])
  }

  install(app: App) {
    const importer = new OneSchemaImporterClass({
      ...this.initOptions,
    })
    importer.setClient("Vue", version)
    app.provide("os-importer", importer)
  }
};