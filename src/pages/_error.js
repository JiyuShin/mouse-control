import React from 'react'

function Error({ statusCode, hasGetInitialPropsRun, err }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🖱️</div>
        <h1 className="text-4xl font-bold mb-4">Mouse Control</h1>
        <p className="text-xl mb-6">
          {statusCode
            ? `서버에서 ${statusCode} 오류가 발생했습니다`
            : '클라이언트에서 오류가 발생했습니다'}
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/mouse-interactive'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 mx-2"
          >
            🎮 Mouse Interactive 페이지로 이동
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 mx-2"
          >
            🔄 새로고침
          </button>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
