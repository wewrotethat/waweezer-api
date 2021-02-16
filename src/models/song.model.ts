import {Entity, model, property} from '@loopback/repository';

@model()
export class Song extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  album: string;

  @property({
    type: 'string',
  })
  youtubeLink?: string;

  @property({
    type: 'string',
  })
  spotifyLink?: string;

  @property({
    type: 'string',
  })
  owner: string;

  @property({
    type: 'string',
    required: true,
  })
  genre: string;


  constructor(data?: Partial<Song>) {
    super(data);
  }
}

export interface SongRelations {
  // describe navigational properties here
}

export type SongWithRelations = Song & SongRelations;
