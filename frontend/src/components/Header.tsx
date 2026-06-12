import { Link } from 'react-router-dom';

function Header() {
  return (
    <>
      <header>
        <div className="bg-white-400 p-4 flex items-center justify-between w-full">
          <div className="p-2 items-center gap-2">
            <div className="relative w-[5vw] h-[5vw] rounded-full overflow-hidden hover:bg-gray-100 rounded-full hover:w-[6vw] hover:h-[6vw] transition-all duration-300">
              {/* Profile picture */}
              <img
                src="/src/assets/dp.png" /* dp path user */
                alt="Profile"
                className="absolute p-3 inset-0 w-full h-full object-cover"
              />
              {/* Frame overlay */}
              <img
                src="/src/assets/vectorO.png" /* frame of choise */
                alt="Frame"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>
            <div className="">
              <p>Mayesha</p> {/* User's Nickname */}
            </div>
          </div>
          <div>
            <Link to="/">
              <img
                className="h-[12vh]"
                src="src/assets/logo1.png"
                alt="My Dear Diary"
              />
            </Link>
          </div>
          <div>
            <img
              src="src/assets/hamburg.png"
              alt=""
              className="w-[4vw] h-[4vw] pd-4 cursor-pointer hover:bg-gray-100 rounded-full hover:w-[5vw] hover:h-[5vw] transition-all duration-300"
            />
          </div>
        </div>
        <div className="flex justify-between pl-10 pr-10">
          <Link to="/entries" className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Past Entries
          </Link>
          <Link to="/new" className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            New Entry
          </Link>
          <button className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Sticker Factory
          </button>
          <button className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Scan Diary
          </button>
          <button className="hover:bg-gray-100 hover:font-bold ">
            Settings
          </button>
        </div>
        <hr />
        <hr />
        <hr />
      </header>
    </>
  );
}

export default Header;
