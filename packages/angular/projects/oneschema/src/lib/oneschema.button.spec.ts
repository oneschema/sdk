import { ComponentFixture, TestBed } from "@angular/core/testing"

import { OneSchemaButton } from "./oneschema.button"
import { OneSchemaService } from "./oneschema.service"
import { OneSchemaParamsService } from "./oneschema.params"

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
          useValue: {},
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
