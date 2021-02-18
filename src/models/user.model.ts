import {Entity, hasOne, model, property} from '@loopback/repository';
import {Name} from './name.model';
import {UserCredentials} from './user-credentials.model';

@model({
  settings: {
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: Name,
    required: true,
  })
  name: Name;

  @property({
    type: 'string',
    default: '',
  })
  photoPath?: string;

  @property({
    type: 'number',
    required: true,
  })
  age: number;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    nullable: false,
  })
  role: string;

  @property({
    type: 'number',
    default: 0,
  })
  numberOfSongsSubmitted?: number;

  @property({
    type: 'number',
    default: 0,
  })
  numberOfPlaylistsCreated?: number;

  @property({
    type: 'array',
    itemType: 'object',
  })
  favoritePlaylists?: object[];

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;
  // Define well-known properties here

  // // Indexer property to allow additional data
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // [prop: string]: any;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
