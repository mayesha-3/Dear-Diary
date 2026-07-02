import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function Header() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Diary Owner';

  return (
    <>
      <header>
        <div className="bg-white-400 p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4 p-2">
            <div className="relative w-[5vw] h-[5vw] min-w-[50px] min-h-[50px] rounded-full overflow-hidden hover:bg-gray-100 transition-all duration-300">
              {/* Profile picture */}
              <img
                src="/src/assets/dp.png" /* dp path user */
                alt="Profile"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                }}
                className="absolute p-3 inset-0 w-full h-full object-cover"
              />
              {/* Frame overlay */}
              <img
                src="/src/assets/vectorO.png" /* frame of choice */
                alt="Frame"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800" style={{ fontFamily: 'var(--sans)' }}>{displayName}</p>
            </div>
          </div>
          <div>
            <Link to="/">
              <img
                className="h-[12vh]"
                src="/src/assets/logo1.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'src/assets/logo1.png';
                }}
                alt="My Dear Diary"
              />
            </Link>
          </div>
          <div>
            <img
              src="/src/assets/hamburg.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'src/assets/hamburg.png';
              }}
              alt=""
              className="w-[4vw] h-[4vw] min-w-[30px] min-h-[30px] pd-4 cursor-pointer hover:bg-gray-100 rounded-full hover:w-[5vw] hover:h-[5vw] transition-all duration-300"
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
          <Link to="/stickers" className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Sticker Factory
          </Link>
          <button className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Scan Diary
          </button>
          <button className="hover:bg-gray-100 hover:font-bold px-3 py-2 rounded">
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="hover:bg-red-50 hover:text-red-600 hover:font-bold px-3 py-2 rounded text-gray-600 transition duration-150"
          >
            Sign Out
          </button>
        </div>
        <hr className="border-[#e3dac9] mt-2" />
      </header>
    </>
  );
}

export default Header;
