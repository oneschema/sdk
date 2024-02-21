import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OneSchemaButton } from "./oneschema.button"
import { OneSchemaService } from "./oneschema.service"
import { OneSchemaParamsService } from "./oneschema.params"
import { By } from "@angular/platform-browser"

describe("OneSchemaButton", () => {
  let component: OneSchemaButton
  let fixture: ComponentFixture<OneSchemaButton>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OneSchemaButton],
      providers: [
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: {
            clientId: "3d2d413e-59c9-4a7a-b07a-bb4e9c3c3f32",
            templateKey: "crm_test",
            importConfig: { type: "local" },
            userJwt:
              "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIzZDJkNDEzZS01OWM5LTRhN2EtYjA3YS1iYjRlOWMzYzNmMzIiLCJ1c2VyX2lkIjoiPFVTRVJfSUQ-In0.18XYrQFiErfIrbBhd6Z3Dnq5mzervnRM2WI99J3NBmo",
            baseUrl: "http://embed.localschema.co:9450",
            devMode: true,
          },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(OneSchemaButton)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
