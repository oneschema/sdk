import { Component } from "@angular/core"
import { OneSchemaButton } from "../src/lib/oneschema.button"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [OneSchemaButton],
  template: `<lib-oneschema-button></lib-oneschema-button>`,
  // styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "default"
}
