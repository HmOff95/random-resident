import MainContent from '@/components/MainContent'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <h1 className="mb-12 text-4xl font-bold text-gray-800">Your Residents</h1>
      <MainContent />
    </main>
  )
}
