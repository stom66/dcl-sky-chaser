# Devotes / Log

## auth-server

Implementing DCL's new authoritative server functionality:

```sh
npm i @dcl/sdk@auth-server @dcl/js-runtime@auth-server
```

- Note the `@dcl/js-runtime` and `@dcl/sdk"` **dependency version must NOT be prefixed with a ^ caret**, as this will upgrade them to the latest version when deployed which, as of this template date, doesn't include the auth-server features.

- Therefore, **don't let Creator hub update dependecies** with this template this
