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
import {Playlist} from '../models';
import {PlaylistRepository} from '../repositories';

export class PlaylistController {
  constructor(
    @repository(PlaylistRepository)
    public playlistRepository : PlaylistRepository,
  ) {}

  @post('/playlists')
  @response(200, {
    description: 'Playlist model instance',
    content: {'application/json': {schema: getModelSchemaRef(Playlist)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Playlist, {
            title: 'NewPlaylist',
            
          }),
        },
      },
    })
    playlist: Playlist,
  ): Promise<Playlist> {
    return this.playlistRepository.create(playlist);
  }

  @get('/playlists/count')
  @response(200, {
    description: 'Playlist model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Playlist) where?: Where<Playlist>,
  ): Promise<Count> {
    return this.playlistRepository.count(where);
  }

  @get('/playlists')
  @response(200, {
    description: 'Array of Playlist model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Playlist, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Playlist) filter?: Filter<Playlist>,
  ): Promise<Playlist[]> {
    return this.playlistRepository.find(filter);
  }

  @patch('/playlists')
  @response(200, {
    description: 'Playlist PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Playlist, {partial: true}),
        },
      },
    })
    playlist: Playlist,
    @param.where(Playlist) where?: Where<Playlist>,
  ): Promise<Count> {
    return this.playlistRepository.updateAll(playlist, where);
  }

  @get('/playlists/{id}')
  @response(200, {
    description: 'Playlist model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Playlist, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Playlist, {exclude: 'where'}) filter?: FilterExcludingWhere<Playlist>
  ): Promise<Playlist> {
    return this.playlistRepository.findById(id, filter);
  }

  @patch('/playlists/{id}')
  @response(204, {
    description: 'Playlist PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Playlist, {partial: true}),
        },
      },
    })
    playlist: Playlist,
  ): Promise<void> {
    await this.playlistRepository.updateById(id, playlist);
  }

  @put('/playlists/{id}')
  @response(204, {
    description: 'Playlist PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() playlist: Playlist,
  ): Promise<void> {
    await this.playlistRepository.replaceById(id, playlist);
  }

  @del('/playlists/{id}')
  @response(204, {
    description: 'Playlist DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.playlistRepository.deleteById(id);
  }
}
