import {Model, model, property} from '@loopback/repository';

@model()
export class Name extends Model {
  @property({
    type: 'string',
    required: true,
  })
  first: string;

  @property({
    type: 'string',
  })
  middle?: string;

  @property({
    type: 'string',
  })
  last?: string;


  constructor(data?: Partial<Name>) {
    super(data);
  }
}

export interface NameRelations {
  // describe navigational properties here
}

export type NameWithRelations = Name & NameRelations;
