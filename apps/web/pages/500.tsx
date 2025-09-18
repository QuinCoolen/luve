export default function Custom500() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800">500</h1>
      <p className="text-2xl text-gray-600 mt-4">Internal Server Error</p>
      <a href="/" className="mt-6 text-primary hover:underline">
        Go back to Home
      </a>
    </div>
  );
}
