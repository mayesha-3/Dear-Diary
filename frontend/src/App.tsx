import "./App.css";
import { useState } from "react";

function App() {
  const [open, setOpen] = useState<string | null>(null)

const toggle = (section: string) => {
  setOpen(open === section ? null : section)
}

  return (
    <>
      <header className="bg-white-400 p-4 flex items-center justify-between w-full">
        <div className="relative w-[4vw] h-[4vw]">
          {/* Profile picture */}
          <img
            src="/src/assets/dp.png" //dp path user
            alt="Profile"
            className="absolute p-2 inset-0 w-full h-full object-cover"
          />
          {/* Frame overlay */}
          <img
            src="/src/assets/vectorO.png" //frame of choise
            alt="Frame"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </div>

        <div>
          <img className="h-[12vh]" src="src/assets/logo1.png" alt="My Dear Diary" />
        </div>
        <div>
          <img
            src="src/assets/hamburg.png"
            alt=""
            className="w-[4vw] h-[4vw] "
          />
        </div>
      </header>
      <main className="p-4">
        <p className="text-lg text-gray-700">
          Welcome to Dear Diary, your personal journaling app. Start writing
          your thoughts and memories today!
        </p>
      </main>

      <footer className="bg-black text-white mt-12">
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
</footer>
      
    </>
  );
}

export default App;
