import {
  authenticate,
  TokenService,
  UserService,
} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {Filter, model, property, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
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
import {
  UserProfileSchema,
  UserSignUpSchema,
} from './specs/user-controller.specs';

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
    @requestBody({
      description: 'New user info',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            example: {
              user: {
                name: {
                  first: 'Yabsra',
                  middle: 'Abdurahman',
                  last: 'Barsebo',
                },
                photoPath: 'photo path',
                age: 22,
                email: 'yabsra23@gmail.com',
              },
              userCredentials: {password: 'password'},
            },
          },
        },
      },
    })
    newUserRequest: UserSignUpSchema,
  ): Promise<User> {
    let user = new User();
    const credentials = newUserRequest.userCredentials;
    user = newUserRequest.user;
    user.role = 'user';

    // ensure a valid email value and password value
    validateCredentials({
      email: user.email,
      password: credentials.password,
    });

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      credentials.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(user, 'password'),
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
    @requestBody({
      description: 'New admin info',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            example: {
              user: {
                name: {
                  first: 'Yabsra',
                  middle: 'Abdurahman',
                  last: 'Barsebo',
                },
                photoPath: 'photo path',
                age: 22,
                email: 'yabsra23@gmail.com',
              },
              userCredentials: {password: 'password'},
            },
          },
        },
      },
    })
    newUserRequest: UserSignUpSchema,
  ): Promise<User> {
    let user = new User();
    const credentials = newUserRequest.userCredentials;
    user = newUserRequest.user;
    user.role = 'admin';

    // ensure a valid email value and password value
    validateCredentials({
      email: user.email,
      password: credentials.password,
    });

    // encrypt the password
    const password = await this.passwordHasher.hashPassword(
      credentials.password,
    );

    try {
      // create the new user
      const savedUser = await this.userRepository.create(
        _.omit(user, 'password'),
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
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
              password: {
                type: 'string',
              },
            },
            example: {
              email: 'yabsra23@gmail.com',
              password: 'password',
            },
          },
        },
      },
      description: 'Authentication credentials',
    })
    credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }

  @get('/users', {
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  @authenticate('jwt')
  async find(@param.filter(User) filter?: Filter<User>): Promise<User[]> {
    return this.userRepository.find(filter);
  }

  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    voters: [basicAuthorization],
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(id, user);
  }

  @patch('/users/me')
  @response(204, {
    description: 'User PATCH success',
  })
  @authenticate('jwt')
  async update(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    user: User,
  ): Promise<void> {
    await this.userRepository.updateById(currentUserProfile[securityId], user);
  }

  @del('/users/{id}')
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    voters: [basicAuthorization],
  })
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.userRepository.deleteById(id);
  }

  @del('/users/me')
  @response(204, {
    description: 'User DELETE success',
  })
  @authenticate('jwt')
  async delete(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<void> {
    await this.userRepository.deleteById(currentUserProfile[securityId]);
  }
}

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
