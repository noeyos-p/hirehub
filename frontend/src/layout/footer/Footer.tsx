export default function Footer() {
  return (
    <footer className="bg-white text-gray-700 py-6 border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h4 className="text-lg font-semibold">@병아리 개발단</h4>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
        <div className="flex space-x-4">
          <a href="/chatBot" className="hover:text-gray-900 transition-colors">고객 상담</a>
        </div>
      </div>
    </footer>
  );
}
