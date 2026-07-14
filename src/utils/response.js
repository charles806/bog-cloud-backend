/**
 * Success Response
 */
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error Response
 */
const errorResponse = (message = 'Something went wrong', statusCode = 500, errors = null) => {
  return {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
};

/**
 * Paginated Response
 */
const paginatedResponse = (data, page, limit, total, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};