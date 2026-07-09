import { createHttpError } from '../utils/httpError.js';

export function validateBody(rules) {
  return (req, _res, next) => {
    const errors = {};

    for (const [field, validators] of Object.entries(rules)) {
      for (const validate of validators) {
        const message = validate(req.body[field], req.body);
        if (message) {
          errors[field] = message;
          break;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return next(createHttpError(400, 'Dữ liệu không hợp lệ', errors));
    }

    return next();
  };
}

export const required = (label) => (value) => {
  if (value === undefined || value === null || value === '') {
    return `${label} là bắt buộc`;
  }
  return '';
};

export const minNumber = (label, min) => (value) => {
  if (value === undefined || value === null || value === '') return '';
  if (Number.isNaN(Number(value)) || Number(value) < min) {
    return `${label} phải lớn hơn hoặc bằng ${min}`;
  }
  return '';
};

export const oneOf = (label, allowedValues) => (value) => {
  if (value === undefined || value === null || value === '') return '';
  if (!allowedValues.includes(value)) {
    return `${label} phải là một trong các giá trị: ${allowedValues.join(
      ', ',
    )}`;
  }
  return '';
};
