const { ZodError } = require('zod');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };
