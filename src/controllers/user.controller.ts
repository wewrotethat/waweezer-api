import {
  authenticate,
  TokenService,
  UserService,
} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {model, property, repository} from '@loopback/repository';
import {get, HttpErrors, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {
  HashPasswordBindings,
  TokenServiceBindings,
  UserServiceBindings,
} from '../keys';
import {basicAuthorization} from '../middlewares/auth.middleware';
import {User} from '../models';
import {Credentials, UserRepository} from '../repositories';
import {HashPasswordService, validateCredentials} from '../services';
import {UserProfileSchema} from './specs/user-controller.specs';

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
  })
  password: string;
}

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(HashPasswordBindings.PASSWORD_HASHER)
    public passwordHasher: HashPasswordService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>,
  ) {}

  @post('/users/sign-up', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async create(
    @requestBody({description: 'login info'})
    newUserRequest: Credentials,
  ): Promise<User> {
    newUserRequest.role = 'user';

    // ensure a valid email value and password value
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );

      // set the password
      await this.userRepository
        .userCredentials(savedUser.id)
        .create({password});

      return savedUser;
    } catch (error) {
      // MongoError 11000 duplicate key
      if (error.code === 11000 && error.errmsg.includes('index: uniqueEmail')) {
        throw new HttpErrors.Conflict('Email value is already taken');
      } else {
        throw error;
      }
    }
  }

  @post('/users/sign-up/admin', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async createAdmin(
    @requestBody({description: 'login info'})
    newUserRequest: Credentials,
  ): Promise<User> {
    // All new users have the "customer" role by default
    newUserRequest.role = 'admin';
    // ensure a valid email value and password value
    validateCredentials(_.pick(newUserRequest, ['email', 'password']));

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(newUserRequest, 'password'),
      );

      // set the password
      await this.userRepository
        .userCredentials(savedUser.id)
        .create({password});

      return savedUser;
    } catch (error) {
      // MongoError 11000 duplicate key
      if (error.code === 11000 && error.errmsg.includes('index: uniqueEmail')) {
        throw new HttpErrors.Conflict('Email value is already taken');
      } else {
        throw error;
      }
    }
  }

  @get('/users/{userId}', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    voters: [basicAuthorization],
  })
  async findById(@param.path.string('userId') userId: string): Promise<User> {
    return this.userRepository.findById(userId);
  }

  @get('/users/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async printCurrentUser(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<User> {
    const userId = currentUserProfile[securityId];
    return this.userRepository.findById(userId);
  }

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({description: 'login info'}) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }
}

// import {
//   Count,
//   CountSchema,
//   Filter,
//   FilterExcludingWhere,
//   repository,
//   Where,
// } from '@loopback/repository';
// import {
//   post,
//   param,
//   get,
//   getModelSchemaRef,
//   patch,
//   put,
//   del,
//   requestBody,
//   response,
// } from '@loopback/rest';
// import {User} from '../models';
// import {UserRepository} from '../repositories';

// export class UserController {
//   constructor(
//     @repository(UserRepository)
//     public userRepository : UserRepository,
//   ) {}

//   @post('/users')
//   @response(200, {
//     description: 'User model instance',
//     content: {'application/json': {schema: getModelSchemaRef(User)}},
//   })
//   async create(
//     @requestBody({
//       content: {
//         'application/json': {
//           schema: getModelSchemaRef(User, {
//             title: 'NewUser',
//             exclude: ['id'],
//           }),
//         },
//       },
//     })
//     user: Omit<User, 'id'>,
//   ): Promise<User> {
//     return this.userRepository.create(user);
//   }

//   @get('/users/count')
//   @response(200, {
//     description: 'User model count',
//     content: {'application/json': {schema: CountSchema}},
//   })
//   async count(
//     @param.where(User) where?: Where<User>,
//   ): Promise<Count> {
//     return this.userRepository.count(where);
//   }

//   @get('/users')
//   @response(200, {
//     description: 'Array of User model instances',
//     content: {
//       'application/json': {
//         schema: {
//           type: 'array',
//           items: getModelSchemaRef(User, {includeRelations: true}),
//         },
//       },
//     },
//   })
//   async find(
//     @param.filter(User) filter?: Filter<User>,
//   ): Promise<User[]> {
//     return this.userRepository.find(filter);
//   }

//   @patch('/users')
//   @response(200, {
//     description: 'User PATCH success count',
//     content: {'application/json': {schema: CountSchema}},
//   })
//   async updateAll(
//     @requestBody({
//       content: {
//         'application/json': {
//           schema: getModelSchemaRef(User, {partial: true}),
//         },
//       },
//     })
//     user: User,
//     @param.where(User) where?: Where<User>,
//   ): Promise<Count> {
//     return this.userRepository.updateAll(user, where);
//   }

//   @get('/users/{id}')
//   @response(200, {
//     description: 'User model instance',
//     content: {
//       'application/json': {
//         schema: getModelSchemaRef(User, {includeRelations: true}),
//       },
//     },
//   })
//   async findById(
//     @param.path.string('id') id: string,
//     @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
//   ): Promise<User> {
//     return this.userRepository.findById(id, filter);
//   }

//   @patch('/users/{id}')
//   @response(204, {
//     description: 'User PATCH success',
//   })
//   async updateById(
//     @param.path.string('id') id: string,
//     @requestBody({
//       content: {
//         'application/json': {
//           schema: getModelSchemaRef(User, {partial: true}),
//         },
//       },
//     })
//     user: User,
//   ): Promise<void> {
//     await this.userRepository.updateById(id, user);
//   }

//   @put('/users/{id}')
//   @response(204, {
//     description: 'User PUT success',
//   })
//   async replaceById(
//     @param.path.string('id') id: string,
//     @requestBody() user: User,
//   ): Promise<void> {
//     await this.userRepository.replaceById(id, user);
//   }

//   @del('/users/{id}')
//   @response(204, {
//     description: 'User DELETE success',
//   })
//   async deleteById(@param.path.string('id') id: string): Promise<void> {
//     await this.userRepository.deleteById(id);
//   }
// }
