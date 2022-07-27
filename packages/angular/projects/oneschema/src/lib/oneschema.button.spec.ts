import { ComponentFixture, TestBed } from '@angular/core/testing'

import { OneSchemaButton } from './oneschema.button'

describe('OneSchemaButton', () => {
  let component: OneSchemaButton
  let fixture: ComponentFixture<OneSchemaButton>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OneSchemaButton],
    }).compileComponents()

    fixture = TestBed.createComponent(OneSchemaButton)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
