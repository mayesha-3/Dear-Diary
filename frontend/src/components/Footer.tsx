function Footer() {
  return (
    <>
    <div className="bg-black text-white mt-12">
            
      <div className="max-w-7xl mx-auto px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* Client Services */}
      <div>
        <h3 className="text-sm font-bold tracking-widest mb-4">
          CLIENT SERVICES
        </h3>

        <ul className="space-y-2 text-gray-300">
          <li>
            <a href="#" className="hover:text-white transition">
              Contact Us
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white transition">
              Our Services
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white transition">
              FAQs
            </a>
          </li>
        </ul>
      </div>

      {/* Legal & Privacy */}
      <div>
        <h3 className="text-sm font-bold tracking-widest mb-4">
          LEGAL & PRIVACY
        </h3>

        <ul className="space-y-2 text-gray-300">
          <li>
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white transition">
              Cookie Policy
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white transition">
              Website Terms of Use
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-white transition">
              Code of Conduct
            </a>
          </li>
        </ul>
      </div>

      {/* Corporate */}
      <div>
        <h3 className="text-sm font-bold tracking-widest mb-4">
          CORPORATE
        </h3>

        <ul className="space-y-2 text-gray-300">
          <li>
            <a href="#" className="hover:text-white transition">
              About Us
            </a>
          </li>
        </ul>

        {/* Social Media */}
        <div className="flex gap-4 mt-6">
          <a href="#">
            <img
              src="/src/assets/facebook.png"
              alt="Facebook"
              className="w-6 h-6 invert hover:scale-110 transition"
            />
          </a>

          <a href="#">
            <img
              src="/src/assets/instagram.png"
              alt="Instagram"
              className="w-6 h-6 invert hover:scale-110 transition"
            />
          </a>

          <a href="#">
            <img
              src="/src/assets/youtube.png"
              alt="YouTube"
              className="w-6 h-6 invert hover:scale-110 transition"
            />
          </a>
        </div>
       </div>
      </div>
      </div>

  <hr className="border-gray-700" />

  <div className="text-center text-xs text-gray-400 py-4 px-4">
    © 2026 Dear Diary — All Rights Reserved. Your Personal Digital Journal.
  </div>
    </div>
    </>
  )
}

export default Footer;