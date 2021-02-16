import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Song} from '../models';
import {SongRepository} from '../repositories';

export class SongController {
  constructor(
    @repository(SongRepository)
    public songRepository : SongRepository,
  ) {}

  @post('/songs')
  @response(200, {
    description: 'Song model instance',
    content: {'application/json': {schema: getModelSchemaRef(Song)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Song, {
            title: 'NewSong',
            
          }),
        },
      },
    })
    song: Song,
  ): Promise<Song> {
    return this.songRepository.create(song);
  }

  @get('/songs/count')
  @response(200, {
    description: 'Song model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Song) where?: Where<Song>,
  ): Promise<Count> {
    return this.songRepository.count(where);
  }

  @get('/songs')
  @response(200, {
    description: 'Array of Song model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Song, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Song) filter?: Filter<Song>,
  ): Promise<Song[]> {
    return this.songRepository.find(filter);
  }

  @patch('/songs')
  @response(200, {
    description: 'Song PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Song, {partial: true}),
        },
      },
    })
    song: Song,
    @param.where(Song) where?: Where<Song>,
  ): Promise<Count> {
    return this.songRepository.updateAll(song, where);
  }

  @get('/songs/{id}')
  @response(200, {
    description: 'Song model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Song, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Song, {exclude: 'where'}) filter?: FilterExcludingWhere<Song>
  ): Promise<Song> {
    return this.songRepository.findById(id, filter);
  }

  @patch('/songs/{id}')
  @response(204, {
    description: 'Song PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Song, {partial: true}),
        },
      },
    })
    song: Song,
  ): Promise<void> {
    await this.songRepository.updateById(id, song);
  }

  @put('/songs/{id}')
  @response(204, {
    description: 'Song PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() song: Song,
  ): Promise<void> {
    await this.songRepository.replaceById(id, song);
  }

  @del('/songs/{id}')
  @response(204, {
    description: 'Song DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.songRepository.deleteById(id);
  }
}
