# CarGo

A carpool application used to connect users and enable them to create carpools by location and time

![screenshot](./cargo.png)

## Engineers/Contributors

- Aly Tamboura
- Mahima Ganapati
- Phong Lam
- Michael Diodoro

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

# Table of Contents

1. [Requirements](#requirements)
2. [Development](#development)
    1. [Installing Dependencies](#installing-system-dependencies)
    1. [Installing Project Dependencies](#install-project-dependencies)
    1. [Database](#database-initialization)
    1. [Running the App](#running-the-app)
    

## Requirements

- Node 6.9.x
- Redis 3.2.x
- Postgresql 9.6.x
- React
- React-native

## Development

### Installing System Dependencies

```
brew install yarn
brew install postgresql
```

Yarn is a replacement for npm. It's faster and *guarantees* consistency -- as you deploy your code in various environments, you won't run the risk of slight variations in what gets installed.

### Install Project Dependencies

```
yarn global add grunt-cli knex eslint
```

## Database Initialization

IMPORTANT: ensure `postgres` is running before performing these steps.

### Database Creation:

Use grunt to create a new database for your development and test environments:

Development environment: `grunt pgcreatedb:default`

Other environments, specify like so: `NODE_ENV=test grunt pgcreatedb:default`

### Run Migrations & Data Seeds

In terminal, from the root directory:

`knex migrate:latest --env NODE_ENV`

`knex migrate:rollback --env NODE_ENV`

`knex seed:run --env NODE_ENV`

`yarn run seed`

Note: `--env NODE_ENV` may be omitted for development. For example, `knex migrate:latest` will run all migrations in the development environment, while `knex migrate:latest --env test` will migrate in the test environment.

## Running the App

To run webpack build: `yarn run build`

To run server: `yarn run start`

To run tests: `yarn run test`


