import { TestBed } from '@angular/core/testing'

import { OneSchemaService } from './oneschema.service'
import { OneSchemaParamsService } from './oneschema.params'

describe('OneSchemaService', () => {
  let service: OneSchemaService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OneSchemaService,
        {
          provide: OneSchemaParamsService,
          useValue: {
            useValue: {
              clientId: '3d2d413e-59c9-4a7a-b07a-bb4e9c3c3f32',
              templateKey: 'crm_test',
              importConfig: { type: 'local' },
              userJwt:
                'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI8Q0xJRU5UX0lEPiIsInVzZXJfaWQiOiI8VVNFUl9JRD4ifQ.not-a-real-signature',
              baseUrl: 'http://embed.localschema.co:9450',
              devMode: true,
            },
          },
        },
      ],
    })
    service = TestBed.inject(OneSchemaService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
