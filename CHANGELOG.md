# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.6.1](https://github.com/akshayfanatic/fcop/compare/v0.6.0...v0.6.1) (2026-08-07)

### Features

- **docs:** added architecture file for understand high level design of system ([ad00499](https://github.com/akshayfanatic/fcop/commit/ad00499bf186e5f63e8228a985f9331dd5e90283))

### Bug Fixes

- **auth:** make user by defualt member role CLIENT ([d06cd1d](https://github.com/akshayfanatic/fcop/commit/d06cd1d02b3e505c143a8d9bc81774b259fd3e48))
- **types:** added types to backend ([be38d9b](https://github.com/akshayfanatic/fcop/commit/be38d9b37c9af7bcd031ea1b6ade2e9b74e124da))

### Code Refactoring

- **permission:** remove serviceRequestMessage permission from auth ([83f1351](https://github.com/akshayfanatic/fcop/commit/83f13515063cdbe63a122a1d93e1fc1e066fddcd))
- **task:** refactor open api specs added Task ([229b658](https://github.com/akshayfanatic/fcop/commit/229b6589165c16a1514bb5e38a94e39769c9af36))

## [0.6.0](https://github.com/akshayfanatic/fcop/compare/v0.5.0...v0.6.0) (2026-08-05)

### Features

- **events:** added events , service, for managing chat events ([04ea40c](https://github.com/akshayfanatic/fcop/commit/04ea40c038e4101baee7664fce340fe78c12cc77))
- **migraiton:** added new table for managing chat_history ([176d0e5](https://github.com/akshayfanatic/fcop/commit/176d0e56579ce56da7cd5c4506e7b174f55729c4))
- **package:** added websocket pacakge for managing chat system ([a98200e](https://github.com/akshayfanatic/fcop/commit/a98200edb23ae27eaf838612714ae622b54293ad))

### Bug Fixes

- **migration:** remove teams related table ([035c44b](https://github.com/akshayfanatic/fcop/commit/035c44be081ad1a38edae293979da552837fe1f7))

### Code Refactoring

- **migration:** added migration for changes in db ([1c62efd](https://github.com/akshayfanatic/fcop/commit/1c62efd6203976b84423a6b40367e1aed3215a83))

## [0.5.0](https://github.com/akshayfanatic/fcop/compare/v0.4.0...v0.5.0) (2026-08-03)

### Features

- **agent:** added stipre best practicess skills ([f675f6a](https://github.com/akshayfanatic/fcop/commit/f675f6aad566e245370316a9f1d1f8f4460e2426))
- **db:** added db migration for managing proposals ([37ce542](https://github.com/akshayfanatic/fcop/commit/37ce542959ee71c95251e5d206483a2ef59506ef))
- **invoice:** added invoice payment flow in propsal creation time ([8eb4dbe](https://github.com/akshayfanatic/fcop/commit/8eb4dbeff95fbd0478d83656b6b231192c091031))
- **lead:** added pagination on leads ([74a9b29](https://github.com/akshayfanatic/fcop/commit/74a9b29ebfde3edae1fef1d86374b304e108cb31))
- **package:** added package for managing stripe payments ([54e9a37](https://github.com/akshayfanatic/fcop/commit/54e9a37b85648b976de012943f5de6586b497aea))
- **project:** added pagination and filter on project ([995c886](https://github.com/akshayfanatic/fcop/commit/995c88663cba45db9c9f3e1cc3c1fed52375342f))
- **route:** added api route endpoint and controller service for managing proposal ([f87f4ab](https://github.com/akshayfanatic/fcop/commit/f87f4abfac7bf1906cc210238cd3ece81685f2ec))
- **spec:** added open api contracts for frontend ([c2c5534](https://github.com/akshayfanatic/fcop/commit/c2c5534d02eb0470a3cb757cbce0828741381ec5))
- **webhook:** setup webhook and controler ([798ac37](https://github.com/akshayfanatic/fcop/commit/798ac37c679dedc6d86402bee0ad01eaaf76d014))

### Bug Fixes

- included project id also in services ([d3d6cc0](https://github.com/akshayfanatic/fcop/commit/d3d6cc0f64a09054b861e402ff72742b3e74218b))

## [0.4.0](https://github.com/akshayfanatic/fcop/compare/v0.2.1...v0.4.0) (2026-07-27)

### Features

- **api:** added api endpoint for project ([bd4a2d3](https://github.com/akshayfanatic/fcop/commit/bd4a2d3f2ea9182fe051348b5e1d4377fb6e1cf5))
- **api:** added controoler, api route for managing project tasks ([551ecea](https://github.com/akshayfanatic/fcop/commit/551ecea097b687b9e7504aea2ce40066a221ce54))
- **controllers:** added controller and servicess regarding project table ([c83e214](https://github.com/akshayfanatic/fcop/commit/c83e2141bea1170fcc5e6561790c20f6722fb1db))
- **email:** send email to assignee to manage it's task ([7c665a2](https://github.com/akshayfanatic/fcop/commit/7c665a2fc76e76cc5d62945148bd6c5f0161eaf9))
- **migration:** added new migration for currency ([3c9da55](https://github.com/akshayfanatic/fcop/commit/3c9da5508077bb32d0f26b67953153bac1b85b91))
- **migration:** added table for managing project ([aa7aa7a](https://github.com/akshayfanatic/fcop/commit/aa7aa7a44dc3b2fe784f0929358e4f772cd856bb))
- **permissions:** added permission to managing task ([abe8e46](https://github.com/akshayfanatic/fcop/commit/abe8e46ba9dcbab2e6bcc4abc44256edfd5390d8))
- **task:** added new schema for managing project tasks ([01019ff](https://github.com/akshayfanatic/fcop/commit/01019ffbbe5e9e95016693d6a0d8140f021a4041))
- **validators:** added zod validators and helper function ([4e4aff2](https://github.com/akshayfanatic/fcop/commit/4e4aff25abbbb2c9f63c87da99b5e3330cddf3ec))

## [0.3.0](https://github.com/akshayfanatic/fcop/compare/v0.2.1...v0.3.0) (2026-07-22)

### Features

- **api:** added api endpoint for project ([bd4a2d3](https://github.com/akshayfanatic/fcop/commit/bd4a2d3f2ea9182fe051348b5e1d4377fb6e1cf5))
- **controllers:** added controller and servicess regarding project table ([c83e214](https://github.com/akshayfanatic/fcop/commit/c83e2141bea1170fcc5e6561790c20f6722fb1db))
- **email:** send email to customer when project is created ([248233f](https://github.com/akshayfanatic/fcop/commit/248233f489a47f22403b268a9dab9fd1aaa78d5c))
- **migration:** added new migration for currency ([3c9da55](https://github.com/akshayfanatic/fcop/commit/3c9da5508077bb32d0f26b67953153bac1b85b91))
- **migration:** added table for managing project ([aa7aa7a](https://github.com/akshayfanatic/fcop/commit/aa7aa7a44dc3b2fe784f0929358e4f772cd856bb))
- **validators:** added zod validators and helper function ([4e4aff2](https://github.com/akshayfanatic/fcop/commit/4e4aff25abbbb2c9f63c87da99b5e3330cddf3ec))

### [0.2.1](https://github.com/akshayfanatic/fcop/compare/v0.2.0...v0.2.1) (2026-07-22)

### Features

- **deployment:** added deployment configurations ([612d5b8](https://github.com/akshayfanatic/fcop/commit/612d5b81a93470c3a0f0616375b10328021d722c))

### Bug Fixes

- **auth:** fixing auth regarding issue ([0ce3b2a](https://github.com/akshayfanatic/fcop/commit/0ce3b2a4afdb398f78d6666ca3073bc2a57292e2))
- **auth:** fixing auth regarding issue ([5eccbd6](https://github.com/akshayfanatic/fcop/commit/5eccbd67d6d0f093e4afa1e7f16241257678120b))
- **auth:** fixing auth regarding issue and code refactor ([249622f](https://github.com/akshayfanatic/fcop/commit/249622f5b307bce4a48090051913032093d086cd))
- **credentials:** fix enviorment credentials related issues ([d870649](https://github.com/akshayfanatic/fcop/commit/d8706496d622b6567b06d90c1afb93b695e10ecf))
- support shared auth cookies across live subdomains ([bed267b](https://github.com/akshayfanatic/fcop/commit/bed267b848ef89450faaa9727061c789880d0683))

### Code Refactoring

- **auth:** added subdomain cookie related configutation ([164d85f](https://github.com/akshayfanatic/fcop/commit/164d85f73799f11ca6d95e2be6b5252a2f8a9ccb))

## [0.2.0](https://github.com/akshayfanatic/fcop/compare/v0.1.0...v0.2.0) (2026-07-16)

### Features

- **auth:** added api routes for creating managing reset password ([381e6b0](https://github.com/akshayfanatic/fcop/commit/381e6b0cf48598cb1114de63a359ccd4c0168706))
- **auth:** added new setup ofr authentication using better auth ([a496f9c](https://github.com/akshayfanatic/fcop/commit/a496f9c8546894ac6f18444cdb7ccc15cb1e576a))
- **auth:** added session for auth management contenxt (member) ([de0d482](https://github.com/akshayfanatic/fcop/commit/de0d482fc0f5835b37eb870021af6e93004d5a7f))
- **comments:** added a new skill for structring comments whenver side effect happen or any other operation happen around operation ([bfb7ebd](https://github.com/akshayfanatic/fcop/commit/bfb7ebdcd1c6fc72e525655ed10530605f4ab24e))
- **controller:** added controler for managin response ([efbcd12](https://github.com/akshayfanatic/fcop/commit/efbcd1289e17eb9422a4c10de083b81def3a7ad2))
- **db:** added new migration for new table requestService ([6c42e37](https://github.com/akshayfanatic/fcop/commit/6c42e37d1a39d193c9de79c04f8cb1af7f402acf))
- **email:** added email support in system for managing and sending email ([781fa6b](https://github.com/akshayfanatic/fcop/commit/781fa6bfca76c9f88f9e107f28f005801372842c))
- **email:** send email to admin regarding new service request coming ([5b6344f](https://github.com/akshayfanatic/fcop/commit/5b6344fadc4930c9cc0b4d2673693a6c7bf721f3))
- **email:** send email to admin when new user accepted member ship ([5bd183b](https://github.com/akshayfanatic/fcop/commit/5bd183b03848c9ec0d5ab130229eb9e214d543ff))
- **invitation:** added new field in invitation table serviceInterest ([fb5c8c7](https://github.com/akshayfanatic/fcop/commit/fb5c8c724b71286ae0c9efa24e2cf029c732c245))
- **member:** update lead data when member accept invitation ([1680179](https://github.com/akshayfanatic/fcop/commit/1680179b649a9d0aa8bb4ea1da7ed46f8994fea1))
- **migration:** added new table serviceRequestMessage for managing request messages ([12e2c93](https://github.com/akshayfanatic/fcop/commit/12e2c9350c1db59fc40d899888c85255dc2aa632))
- **organization:** modify organization hook ( beforeInvitation ) and attach binding ([dc32898](https://github.com/akshayfanatic/fcop/commit/dc328981cf37ce928ba0e1adf652e4644fec8d80))
- **permission:** give all permission and manger for CRUD regarding service request and manager invitations ([c93d699](https://github.com/akshayfanatic/fcop/commit/c93d6990686ccfafb7081ad1598434da2053cd9d))
- **rbac:** added new endpoint to making /api/me to enhance permission and security ([9847f17](https://github.com/akshayfanatic/fcop/commit/9847f17fdb21cd8155958ec3b44064d576d2429e))
- **rbac:** added permission for managing serviceRequest ([3044c17](https://github.com/akshayfanatic/fcop/commit/3044c17c84ae5e355b69bb6da861b0d1eb28bfd9))
- **requestMessage:** added api endpoint for service request meesages ([dc4d527](https://github.com/akshayfanatic/fcop/commit/dc4d527c9231955d3f9b0e79e47d81221bf0715e))
- **servicerequest:** added endpoint regarding serviceRequest entity ([d05f795](https://github.com/akshayfanatic/fcop/commit/d05f7958acdd6ad64db10ae2e26c897e7223fc8a))
- **spec:** added spec for managing contracts types ([afe6eb4](https://github.com/akshayfanatic/fcop/commit/afe6eb4ed4571ffe2ebafefe441cfbab93582e30))

### Bug Fixes

- **husky:** added pre push hook to build before push ([f21038e](https://github.com/akshayfanatic/fcop/commit/f21038e9d52feed4e82ec4effce537dfa01b75d5))

### Code Refactoring

- **auth:** added feature for reinvitte and cancel previousl invite ([653b5b7](https://github.com/akshayfanatic/fcop/commit/653b5b70ab73674c406f8b87e86234a0d0517165))
- **db:** added new migration for qualified lead status ([f864fc2](https://github.com/akshayfanatic/fcop/commit/f864fc2b8cfbd839d2bb56280799f6225b9d3cb5))
- **prettier:** update formating rules ([c4f4e1b](https://github.com/akshayfanatic/fcop/commit/c4f4e1bb323f40ea19dad8d3a4d0329994ce9872))

## [0.1.0](https://github.com/akshayfanatic/fcop/compare/v0.0.2...v0.1.0) (2026-07-02)

### Features

- **email:** added email integration ([6142291](https://github.com/akshayfanatic/fcop/commit/6142291b73ebd9afbc662090fccef9837dd0773d))
- **email:** added email setup and configuration ([f05d288](https://github.com/akshayfanatic/fcop/commit/f05d2883bdefb6dd4db3b38576832bdfb403f07c))
- **lead:** added mutations routes endpoints for leads ([3434259](https://github.com/akshayfanatic/fcop/commit/34342599e6d1463302494d5fb0bbc7e115fbc56d))
- **lead:** created new migration for managing leads ([8a085c8](https://github.com/akshayfanatic/fcop/commit/8a085c88a8bb6510fd918bbbc4fb1768f9cf3520))
- **leads:** added new endpoint for creating lead ([d0d717c](https://github.com/akshayfanatic/fcop/commit/d0d717cc5634c3e9c7054253f8241983b1bc7e59))
- **roles:** add new roles in enum user ([501b9e1](https://github.com/akshayfanatic/fcop/commit/501b9e1901d3f7c94173e21e030e33283c65d5ed))
- **seed:** added dummy seed data to db ([59dd094](https://github.com/akshayfanatic/fcop/commit/59dd094df368691a224dd0c9db2a9b8e445c5f92))
- **skills:** added new skills regarding prisma ([b80e91d](https://github.com/akshayfanatic/fcop/commit/b80e91dde2886ec34de383c9de50f4a987058872))

### Code Refactoring

- **error handling, responses:** created error handling and repsonses acknoledgement separately ([0ae07a0](https://github.com/akshayfanatic/fcop/commit/0ae07a05ed92b5a4f5a3b5823a5d9d54df3a98a0))

### [0.0.2](https://github.com/akshayfanatic/fcop/compare/v1.0.2...v0.0.2) (2026-06-29)

### [1.0.2](https://github.com/akshayfanatic/fcop/compare/v1.0.1...v1.0.2) (2026-06-29)

### Features

- **factory:** addded necessary factory functions ([6c3de8b](https://github.com/akshayfanatic/fcop/commit/6c3de8bb71c56bc592ecf8904810be0d9824fd54))
- **logger:** setup logger configuratiaon to check logs what request is coming ([192fc47](https://github.com/akshayfanatic/fcop/commit/192fc47bec8eedb0b20da2245628a9f455c4cdb6))

### Code Refactoring

- **formatting:** setup formatting rule ([4d53f81](https://github.com/akshayfanatic/fcop/commit/4d53f810e4a58610b2937f10df169a241f5bce93))

### 1.0.1 (2026-06-27)

### Features

- **setup:** scaffold and setup backend for fcop ([6c80790](https://github.com/akshayfanatic/fcop/commit/6c80790811cd2883ecdca371fbc7a9246491b3ec))
- **workflow setup:** added husky ,linting and prettier and semantic version ([4879c98](https://github.com/akshayfanatic/fcop/commit/4879c985e926e203100ae75ad51c3c3a829e9b7c))

### Bug Fixes

- **readme:** remove stuff from env ([af3a9cf](https://github.com/akshayfanatic/fcop/commit/af3a9cfa9f9db4d5c0e3fb848216642db1ab2e21))
