import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Song, SongRelations} from '../models';

export class SongRepository extends DefaultCrudRepository<
  Song,
  typeof Song.prototype.id,
  SongRelations
> {
  constructor(
    @inject('datasources.Mongo') dataSource: MongoDataSource,
  ) {
    super(Song, dataSource);
  }
}
