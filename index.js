exports.handler = async (event) => {
  var response = {
    statusCode: 404,
    body: JSON.stringify({
      message: '잘못된 접근',
      error: 'No routes',
    }),
  };
  if (event.path == '/api/getuser') {
    response = {
      statusCode: 200,
      body: {message: '성공적으로 응답하였습니다.', user: 'test'}
    }
  }
  return response;
}