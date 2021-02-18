import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Playlist} from '../models';
import {PlaylistRepository} from '../repositories';

export class PlaylistController {
  constructor(
    @repository(PlaylistRepository)
    public playlistRepository: PlaylistRepository,
  ) {}

  @post('/playlists')
  @response(200, {
    description: 'Playlist model instance',
    content: {'application/json': {schema: getModelSchemaRef(Playlist)}},
  })
  @authenticate('jwt')
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
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    playlist: Playlist,
  ): Promise<Playlist> {
    const userId = currentUserProfile[securityId];
    playlist.owner = userId;
    return this.playlistRepository.create(playlist);
  }

  @get('/playlists/count')
  @authenticate('jwt')
  @response(200, {
    description: 'Playlist model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Playlist) where?: Where<Playlist>): Promise<Count> {
    return this.playlistRepository.count(where);
  }

  @get('/playlists')
  @authenticate('jwt')
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
  @authenticate('jwt')
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
  @authenticate('jwt')
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Playlist, {exclude: 'where'})
    filter?: FilterExcludingWhere<Playlist>,
  ): Promise<Playlist> {
    return this.playlistRepository.findById(id, filter);
  }

  @patch('/playlists/{id}')
  @response(204, {
    description: 'Playlist PATCH success',
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Playlist, {partial: true}),
        },
      },
    })
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    playlist: Playlist,
  ): Promise<void> {
    const userId = currentUserProfile[securityId];
    playlist.owner = userId;
    await this.playlistRepository.updateById(id, playlist);
  }

  @put('/playlists/{id}')
  @response(204, {
    description: 'Playlist PUT success',
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() playlist: Playlist,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<void> {
    const userId = currentUserProfile[securityId];
    playlist.owner = userId;
    await this.playlistRepository.replaceById(id, playlist);
  }

  @del('/playlists/{id}')
  @authenticate('jwt')
  @response(204, {
    description: 'Playlist DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.playlistRepository.deleteById(id);
  }
}
