import { TestBed } from "@angular/core/testing"

import { OneSchemaService } from "./oneschema.service"
import { OneSchemaParamsService } from "./oneschema.params"

describe("OneSchemaService", () => {
  let service: OneSchemaService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: {},
        },
      ],
    })
    service = TestBed.inject(OneSchemaService)
  })

  it("should be created", () => {
    expect(service).toBeTruthy()
  })
})
