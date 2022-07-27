import { TestBed } from '@angular/core/testing'

import { OneSchemaService } from './oneschema.service'

describe('OneSchemaService', () => {
  let service: OneSchemaService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(OneSchemaService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
