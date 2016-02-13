error = (name, defaultMsg='Boom!') ->
  fn = (msg) ->
    # This way of creating a custom exception works on V8
    Error.call @
    Error.captureStackTrace @, fn
    @.message = msg or defaultMsg
    @.name = name or 'Unspecified'
  fn::__proto__ = Error.prototype
  fn

module.exports =
  error: error
  Unauthorized: error 'Unauthorized', 'Unauthorized'
  NotFound: error 'NotFound', 'Not Found'
  NotValid: error 'NotValid', 'Not Valid'
  InputError: error 'NotValid', 'Input Error'
  NotAuthorized: error 'NotAuthorized', 'Not Authorized'
