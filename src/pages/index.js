import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Mouse Control Website</title>
        <meta name="description" content="Interactive mouse control visualization website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-8">
            Mouse Control
            <span className="block text-indigo-600">Website</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Interactive mouse visualization and physics simulation platform.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Technologies Used</h2>
            <ul className="text-left space-y-2 text-gray-600">
              <li>✅ Next.js (Pages Router)</li>
              <li>✅ React</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ ESLint</li>
              <li>✅ PostCSS</li>
            </ul>
          </div>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <a 
                  href="/mouse-interactive"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 mr-4"
                >
                  🖱️ Basic Interactive
                </a>
                <a 
                  href="/advanced-mouse"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  ⚡ Advanced Physics
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Real-time mouse movement visualization and physics data analysis pages
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
