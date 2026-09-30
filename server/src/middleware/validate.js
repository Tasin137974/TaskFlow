const AppError = require('../utils/AppError');

/**
 * validate({ body, query, params }) - each entry is a Zod schema.
 * Replaces the request part with the parsed (trimmed, coerced, defaulted) value.
 */
module.exports = (schemas) => (req, _res, next) => {
  const details = {};

  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (result.success) {
      req[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || part;
        if (!details[key]) details[key] = issue.message;
      }
    }
  }

  if (Object.keys(details).length > 0) {
    return next(new AppError(400, 'Validation failed', details));
  }
  next();
};
