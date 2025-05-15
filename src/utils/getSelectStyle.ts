export default function getSelectStyle(criteria: string | null) {
  return `shadow-md text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 bg-white ${criteria === null ? 'border-red-500 border-4 animate-pulse' : 'border border-gray-300'}`
}
